"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import fs from "fs/promises";
import path from "path";

function getFirstDueDate(startDate: Date, billingDay: number) {
  const date = new Date(startDate);
  date.setDate(billingDay);
  if (date < startDate) {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

function getNextDueDate(currentDueDate: Date, recurrence: string) {
  const date = new Date(currentDueDate);
  if (recurrence === "MENSAL") {
    date.setMonth(date.getMonth() + 1);
  } else if (recurrence === "ANUAL") {
    date.setFullYear(date.getFullYear() + 1);
  } else if (recurrence === "SEMANAL") {
    date.setDate(date.getDate() + 7);
  }
  return date;
}

export async function createClientContract(formData: FormData) {
  try {
    const clientId = sanitizeInput(formData.get("clientId") as string);
    const title = sanitizeInput(formData.get("title") as string);
    const valueStr = sanitizeInput(formData.get("value") as string);
    const billingDayStr = sanitizeInput(formData.get("billingDay") as string);
    const startDateStr = sanitizeInput(formData.get("startDate") as string);

    if (!clientId || !title || !valueStr || !billingDayStr || !startDateStr) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    const value = parseFloat(valueStr.replace(",", "."));
    const billingDay = parseInt(billingDayStr, 10);
    const startDate = new Date(startDateStr);

    if (isNaN(value) || value <= 0) {
      return { success: false, error: "Informe um valor mensal válido." };
    }

    if (isNaN(billingDay) || billingDay < 1 || billingDay > 28) {
      return { success: false, error: "O dia de vencimento deve estar entre 1 e 28." };
    }

    const recurrence = sanitizeInput(formData.get("recurrence") as string) || "MENSAL";

    const contract = await prisma.clientContract.create({
      data: {
        clientId,
        title,
        value,
        billingDay,
        startDate,
        status: "ATIVO",
        recurrence
      }
    });

    const firstDueDate = getFirstDueDate(startDate, billingDay);
    
    await prisma.clientBilling.create({
      data: {
        contractId: contract.id,
        dueDate: firstDueDate,
        amount: value,
        status: "PENDENTE"
      }
    });

    revalidatePath("/financeiro-clientes");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em createClientContract:", error);
    return { success: false, error: "Ocorreu um erro ao criar o contrato." };
  }
}

export async function payClientBilling(formData: FormData) {
  try {
    const billingId = sanitizeInput(formData.get("billingId") as string);
    const attachment = formData.get("attachment") as File;

    if (!billingId) {
      return { success: false, error: "ID da mensalidade não fornecido." };
    }

    if (!attachment || attachment.size === 0 || !attachment.name) {
      return { success: false, error: "Por favor, selecione um comprovante de pagamento válido." };
    }

    const billing = await prisma.clientBilling.findUnique({
      where: { id: billingId },
      include: { contract: true }
    });

    if (!billing) {
      return { success: false, error: "Mensalidade não encontrada." };
    }

    // Upload físico do arquivo
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const sanitizedFileName = sanitizeInput(attachment.name);
    const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await attachment.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    // Atualizar a fatura para PAGO
    await prisma.clientBilling.update({
      where: { id: billingId },
      data: {
        status: "PAGO",
        proofFileName: attachment.name,
        proofFileUrl: fileUrl,
        paidAt: new Date()
      }
    });

    // Gerar a próxima fatura se houver recorrência
    if (billing.contract && billing.contract.recurrence !== "NENHUMA") {
      const nextDueDate = getNextDueDate(billing.dueDate, billing.contract.recurrence);
      
      // Verificar se já não existe uma fatura pendente com essa mesma data para evitar duplicação em cliques duplos
      const existingNext = await prisma.clientBilling.findFirst({
        where: { contractId: billing.contractId, dueDate: nextDueDate }
      });

      if (!existingNext) {
        await prisma.clientBilling.create({
          data: {
            contractId: billing.contractId,
            dueDate: nextDueDate,
            amount: billing.contract.value,
            status: "PENDENTE"
          }
        });
      }
    }

    revalidatePath("/financeiro-clientes");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em payClientBilling:", error);
    return { success: false, error: "Ocorreu um erro ao processar o pagamento." };
  }
}

export async function deleteContract(formData: FormData) {
  try {
    const contractId = sanitizeInput(formData.get("contractId") as string);
    if (!contractId) {
      return { success: false, error: "ID do contrato inválido." };
    }

    await prisma.clientContract.delete({
      where: { id: contractId }
    });

    revalidatePath("/financeiro-clientes");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em deleteContract:", error);
    return { success: false, error: "Erro ao excluir o contrato." };
  }
}

export async function updateClientContract(contractId: string, formData: FormData) {
  try {
    const title = sanitizeInput(formData.get("title") as string);
    const valueStr = sanitizeInput(formData.get("value") as string);
    const billingDayStr = sanitizeInput(formData.get("billingDay") as string);
    const startDateStr = sanitizeInput(formData.get("startDate") as string);
    const status = sanitizeInput(formData.get("status") as string);
    const recurrence = sanitizeInput(formData.get("recurrence") as string) || "MENSAL";

    if (!title || !valueStr || !billingDayStr || !startDateStr) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    const value = parseFloat(valueStr.replace(",", "."));
    const billingDay = parseInt(billingDayStr, 10);
    const startDate = new Date(startDateStr);

    if (isNaN(value) || value <= 0) {
      return { success: false, error: "Informe um valor mensal válido." };
    }

    if (isNaN(billingDay) || billingDay < 1 || billingDay > 28) {
      return { success: false, error: "O dia de vencimento deve estar entre 1 e 28." };
    }

    await prisma.clientContract.update({
      where: { id: contractId },
      data: {
        title,
        value,
        billingDay,
        startDate,
        status,
        recurrence
      }
    });

    revalidatePath("/financeiro-clientes");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateClientContract:", error);
    return { success: false, error: "Erro ao atualizar o contrato." };
  }
}
