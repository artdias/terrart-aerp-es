"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

export async function createRole(formData: FormData) {
  try {
    const name = sanitizeInput(formData.get("name") as string);
    const description = sanitizeInput(formData.get("description") as string);

    if (!name) {
      return { success: false, error: "Nome do cargo é obrigatório." };
    }

    const existingRole = await prisma.jobRole.findUnique({
      where: { name }
    });

    if (existingRole) {
      return { success: false, error: "Este cargo já existe." };
    }

    await prisma.jobRole.create({
      data: { name, description }
    });

    revalidatePath("/funcionarios/cargos");
    revalidatePath("/funcionarios/novo");
    revalidatePath("/funcionarios");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em createRole:", error);
    return { success: false, error: "Ocorreu um erro ao tentar criar o cargo." };
  }
}

export async function deleteRole(formData: FormData) {
  try {
    const id = sanitizeInput(formData.get("roleId") as string);
    if (!id) {
      return { success: false, error: "ID de cargo inválido." };
    }

    // Optional: We could check if there are employees using this role before deleting
    const role = await prisma.jobRole.findUnique({ where: { id } });
    if (!role) {
      return { success: false, error: "Cargo não encontrado." };
    }

    const employeesWithRole = await prisma.employee.count({
      where: { roleTitle: role.name, deleted: false }
    });

    if (employeesWithRole > 0) {
      return { success: false, error: `Não é possível excluir: existem ${employeesWithRole} funcionário(s) ativos usando este cargo.` };
    }

    await prisma.jobRole.delete({
      where: { id }
    });

    revalidatePath("/funcionarios/cargos");
    revalidatePath("/funcionarios/novo");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em deleteRole:", error);
    return { success: false, error: "Ocorreu um erro interno ao tentar excluir o cargo." };
  }
}
