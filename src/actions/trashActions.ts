"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";
import { logAction } from "@/lib/audit";

export async function restoreRecordAction(formData: FormData) {
  const id = sanitizeInput(formData.get("id") as string);
  const type = sanitizeInput(formData.get("type") as string);

  if (!id || !type) {
    throw new Error("ID e Tipo de registro são obrigatórios.");
  }

  if (type === "CLIENT") {
    const client = await prisma.client.update({
      where: { id },
      data: { deleted: false }
    });
    await logAction("RESTORE_CLIENT", `Restaurou o cliente '${client.companyName}' (ID: ${id}) da lixeira.`);
  } else if (type === "EMPLOYEE") {
    const employee = await prisma.employee.update({
      where: { id },
      data: { deleted: false }
    });
    const fullName = `${employee.firstName} ${employee.lastName || ""}`.trim();
    await logAction("RESTORE_EMPLOYEE", `Restaurou o funcionário '${fullName}' (ID: ${id}) da lixeira.`);
  } else if (type === "PRODUCT") {
    const product = await prisma.product.update({
      where: { id },
      data: { deleted: false }
    });
    await logAction("RESTORE_PRODUCT", `Restaurou o produto '${product.name}' (ID: ${id}) da lixeira.`);
  } else {
    throw new Error("Tipo de registro desconhecido.");
  }

  revalidatePath("/lixeira");
  revalidatePath("/clientes");
  revalidatePath("/funcionarios");
  revalidatePath("/estoque");
}

export async function deleteRecordPermanentlyAction(formData: FormData) {
  const id = sanitizeInput(formData.get("id") as string);
  const type = sanitizeInput(formData.get("type") as string);

  if (!id || !type) {
    throw new Error("ID e Tipo de registro são obrigatórios.");
  }

  if (type === "CLIENT") {
    const client = await prisma.client.findUnique({ where: { id } });
    if (client) {
      await prisma.client.delete({ where: { id } });
      await logAction("HARD_DELETE_CLIENT", `Excluiu definitivamente o cliente '${client.companyName}' (ID: ${id}) do banco de dados.`);
    }
  } else if (type === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (employee) {
      // Deletar também o perfil de login de usuário se houver
      if (employee.userId) {
        try {
          await prisma.user.delete({ where: { id: employee.userId } });
        } catch (e) {
          // ignore
        }
      }
      await prisma.employee.delete({ where: { id } });
      const fullName = `${employee.firstName} ${employee.lastName || ""}`.trim();
      await logAction("HARD_DELETE_EMPLOYEE", `Excluiu definitivamente o funcionário '${fullName}' (ID: ${id}) do banco de dados.`);
    }
  } else if (type === "PRODUCT") {
    const product = await prisma.product.findUnique({ where: { id } });
    if (product) {
      await prisma.product.delete({ where: { id } });
      await logAction("HARD_DELETE_PRODUCT", `Excluiu definitivamente o produto '${product.name}' (ID: ${id}) do banco de dados.`);
    }
  } else {
    throw new Error("Tipo de registro desconhecido.");
  }

  revalidatePath("/lixeira");
  revalidatePath("/clientes");
  revalidatePath("/funcionarios");
  revalidatePath("/estoque");
}
