"use server";

import { prisma } from "@/lib/prisma";
import { generateNextBadgeCode, getSectorPrefix } from "@/lib/badgeCode";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";

/**
 * Preenche automaticamente o departamento e o código de crachá para todos os funcionários e usuários que ainda não possuem um código.
 */
export async function ensureAllBadgeCodes() {
  try {
    // 1. Processar Funcionários
    const employeesWithoutCode = await prisma.employee.findMany({
      where: {
        OR: [
          { badgeCode: null },
          { badgeCode: "" }
        ]
      },
      include: { user: true }
    });

    let updatedEmployeesCount = 0;
    for (const emp of employeesWithoutCode) {
      const dept = emp.department || emp.roleTitle || "Operacional";
      const newCode = await generateNextBadgeCode(dept);
      
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          department: dept,
          badgeCode: newCode
        }
      });

      // Se possui usuário vinculado, atualiza o usuário também
      if (emp.userId) {
        await prisma.user.update({
          where: { id: emp.userId },
          data: {
            department: dept,
            badgeCode: newCode
          }
        }).catch(() => {}); // se o badgeCode já existe ou colidir, ignora
      }
      updatedEmployeesCount++;
    }

    // 2. Processar Usuários (sem funcionário vinculado ou com badgeCode nulo)
    const usersWithoutCode = await prisma.user.findMany({
      where: {
        OR: [
          { badgeCode: null },
          { badgeCode: "" }
        ]
      }
    });

    let updatedUsersCount = 0;
    for (const u of usersWithoutCode) {
      const dept = u.department || (u.role === "ADMIN" ? "Administração" : "Geral");
      const newCode = await generateNextBadgeCode(dept);

      await prisma.user.update({
        where: { id: u.id },
        data: {
          department: dept,
          badgeCode: newCode
        }
      });
      updatedUsersCount++;
    }

    await logAction("GENERATE_BADGE_CODES", `Gerou códigos de crachá para ${updatedEmployeesCount} funcionários e ${updatedUsersCount} usuários.`);

    revalidatePath("/crachas");
    revalidatePath("/funcionarios");
    revalidatePath("/usuarios");

    return {
      success: true,
      message: `Códigos gerados com sucesso! (${updatedEmployeesCount} funcionários, ${updatedUsersCount} usuários)`
    };
  } catch (error: any) {
    console.error("Erro em ensureAllBadgeCodes:", error);
    return { success: false, error: error.message || "Erro ao gerar códigos em lote." };
  }
}

/**
 * Atualiza setor e código de crachá de um usuário ou funcionário específico
 */
export async function updateBadgeInfo(id: string, type: "employee" | "user", department: string, badgeCode: string) {
  try {
    const cleanDept = department.trim();
    const cleanCode = badgeCode.trim().toUpperCase();

    if (!cleanCode) {
      return { success: false, error: "O código do crachá é obrigatório." };
    }

    if (type === "employee") {
      // Verificar unicidade em Employee
      const empConflict = await prisma.employee.findFirst({
        where: { badgeCode: cleanCode, id: { not: id } }
      });
      if (empConflict) {
        return { success: false, error: `O código de crachá ${cleanCode} já está em uso por outro funcionário.` };
      }

      // Verificar unicidade em User
      const userConflict = await prisma.user.findFirst({
        where: { badgeCode: cleanCode }
      });
      if (userConflict) {
        const emp = await prisma.employee.findUnique({ where: { id }, select: { userId: true } });
        if (userConflict.id !== emp?.userId) {
          return { success: false, error: `O código de crachá ${cleanCode} já está em uso por outro usuário.` };
        }
      }

      const updatedEmp = await prisma.employee.update({
        where: { id },
        data: { department: cleanDept, badgeCode: cleanCode }
      });

      if (updatedEmp.userId) {
        await prisma.user.update({
          where: { id: updatedEmp.userId },
          data: { department: cleanDept, badgeCode: cleanCode }
        }).catch(() => {});
      }
    } else {
      // type === "user"
      const userConflict = await prisma.user.findFirst({
        where: { badgeCode: cleanCode, id: { not: id } }
      });
      if (userConflict) {
        return { success: false, error: `O código de crachá ${cleanCode} já está em uso por outro usuário.` };
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { department: cleanDept, badgeCode: cleanCode }
      });

      const emp = await prisma.employee.findFirst({ where: { userId: id } });
      if (emp) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { department: cleanDept, badgeCode: cleanCode }
        }).catch(() => {});
      }
    }

    revalidatePath("/crachas");
    revalidatePath("/funcionarios");
    revalidatePath("/usuarios");

    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateBadgeInfo:", error);
    return { success: false, error: "Erro ao atualizar informações do crachá." };
  }
}
