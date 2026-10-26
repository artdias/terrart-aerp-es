"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import { logAction } from "@/lib/audit";
import fs from "fs/promises";
import path from "path";

function formatCompetencyPrefix(competencyMonth: string): string {
  if (!competencyMonth || !competencyMonth.includes("-")) return "";
  const [year, month] = competencyMonth.split("-");
  if (!year || !month) return "";
  return `[Ref: ${month}/${year}] `;
}

export async function createInvoice(formData: FormData) {
  try {
    const clientId = sanitizeInput(formData.get("clientId") as string);
    const competencyMonth = sanitizeInput((formData.get("competencyMonth") as string) || "");
    const rawDescription = sanitizeInput((formData.get("description") as string) || "");
    const amountStr = sanitizeInput((formData.get("amount") as string) || "0");
    const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
    const initialStatus = sanitizeInput((formData.get("status") as string) || "PENDING");
    const paidAtStr = sanitizeInput((formData.get("paidAt") as string) || "");

    if (!clientId || !dueDateStr) {
      return { success: false, error: "Cliente e Data de Pagamento/Vencimento são obrigatórios" };
    }

    const amount = parseFloat(amountStr.replace(",", ".")) || 0;
    const dueDate = new Date(`${dueDateStr}T12:00:00`);

    const prefix = formatCompetencyPrefix(competencyMonth);
    const description = prefix
      ? `${prefix}${rawDescription.replace(/^\[Ref:\s*\d{2}\/\d{4}\]\s*/i, "").trim() || "Nota Fiscal Importada"}`
      : rawDescription || "Nota Fiscal Importada";

    const attachment = formData.get("attachment") as File;
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (attachment && attachment.size > 0 && attachment.name) {
      const sanitizedFileName = sanitizeInput(attachment.name);
      const buffer = Buffer.from(await attachment.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = attachment.type || "application/octet-stream";

      fileUrl = `data:${mimeType};base64,${base64}`;
      fileName = sanitizedFileName;
    }

    const status = initialStatus === "PAID" ? "PAID" : "PENDING";
    const paidMetadata =
      status === "PAID"
        ? `PAID_AT:${paidAtStr || new Date().toISOString().split("T")[0]}`
        : null;

    await prisma.invoice.create({
      data: {
        clientId,
        description,
        amount,
        dueDate,
        status,
        fileUrl,
        fileName,
        cancellationReason: paidMetadata
      }
    });

    await logAction(
      "IMPORT_CLIENT_NOTE",
      `Importou nota/fatura '${description}' (Valor: R$ ${amount.toFixed(2)}, Vencimento: ${dueDateStr}) para o cliente ID ${clientId}.`
    );

    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clientId}`);
    revalidatePath(`/clientes/${clientId}/notas`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em createInvoice:", error);
    return { success: false, error: "Erro interno ao criar/importar nota." };
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const clientId = sanitizeInput(formData.get("clientId") as string);
    const competencyMonth = sanitizeInput((formData.get("competencyMonth") as string) || "");
    const rawDescription = sanitizeInput((formData.get("description") as string) || "");
    const amountStr = sanitizeInput((formData.get("amount") as string) || "0");
    const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
    const status = sanitizeInput((formData.get("status") as string) || "PENDING");
    const paidAtStr = sanitizeInput((formData.get("paidAt") as string) || "");

    if (!clientId || !dueDateStr) {
      return { success: false, error: "Cliente e Data de Pagamento/Vencimento são obrigatórios" };
    }

    const amount = parseFloat(amountStr.replace(",", ".")) || 0;
    const dueDate = new Date(`${dueDateStr}T12:00:00`);

    const prefix = formatCompetencyPrefix(competencyMonth);
    const cleanDesc = rawDescription.replace(/^\[Ref:\s*\d{2}\/\d{4}\]\s*/i, "").trim();
    const description = prefix ? `${prefix}${cleanDesc || "Nota Fiscal"}` : rawDescription;

    const dataToUpdate: any = {
      clientId,
      description,
      amount,
      dueDate,
      status
    };

    if (status === "PAID") {
      const paidDate = paidAtStr || new Date().toISOString().split("T")[0];
      dataToUpdate.cancellationReason = `PAID_AT:${paidDate}`;
    } else if (status === "PENDING") {
      dataToUpdate.cancellationReason = null;
    }

    const attachment = formData.get("attachment") as File;
    if (attachment && attachment.size > 0 && attachment.name) {
      const sanitizedFileName = sanitizeInput(attachment.name);
      const buffer = Buffer.from(await attachment.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = attachment.type || "application/octet-stream";

      dataToUpdate.fileUrl = `data:${mimeType};base64,${base64}`;
      dataToUpdate.fileName = sanitizedFileName;
    }

    await prisma.invoice.update({
      where: { id },
      data: dataToUpdate
    });

    await logAction(
      "UPDATE_CLIENT_NOTE",
      `Atualizou nota/fatura ID ${id} (Status: ${status}, Vencimento: ${dueDateStr}, Valor: R$ ${amount.toFixed(2)}).`
    );

    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clientId}`);
    revalidatePath(`/clientes/${clientId}/notas`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateInvoice:", error);
    return { success: false, error: "Erro interno ao atualizar fatura." };
  }
}

export async function payInvoice(formData: FormData) {
  try {
    const invoiceId = sanitizeInput(formData.get("invoiceId") as string);
    const paidAtStr = sanitizeInput((formData.get("paidAt") as string) || "");
    
    if (!invoiceId) {
      return { success: false, error: "ID da fatura não fornecido." };
    }

    const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!existing) {
      return { success: false, error: "Nota/Fatura não encontrada." };
    }

    const receiptFile = formData.get("receipt") as File;
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
      const sanitizedFileName = sanitizeInput(receiptFile.name);
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = receiptFile.type || "application/octet-stream";

      fileUrl = `data:${mimeType};base64,${base64}`;
      fileName = sanitizedFileName;
    }

    const paidDate = paidAtStr || new Date().toISOString().split("T")[0];

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        cancellationReason: `PAID_AT:${paidDate}`,
        // Só substitui fileUrl se a nota não tinha arquivo anexado antes
        ...(!existing.fileUrl && fileUrl ? { fileUrl, fileName } : {})
      }
    });

    await logAction(
      "PAY_CLIENT_NOTE",
      `Marcou como PAGA a nota/fatura '${existing.description || invoiceId}' (Data pagamento: ${paidDate}).`
    );

    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${existing.clientId}`);
    revalidatePath(`/clientes/${existing.clientId}/notas`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em payInvoice:", error);
    return { success: false, error: "Erro interno ao baixar fatura." };
  }
}

export async function unpayInvoice(formData: FormData) {
  try {
    const invoiceId = sanitizeInput(formData.get("invoiceId") as string);
    if (!invoiceId) {
      return { success: false, error: "ID da nota não fornecido." };
    }

    const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!existing) {
      return { success: false, error: "Nota não encontrada." };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PENDING",
        cancellationReason: null
      }
    });

    await logAction(
      "UNPAY_CLIENT_NOTE",
      `Reverteu para PENDENTE a nota/fatura '${existing.description || invoiceId}'.`
    );

    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${existing.clientId}`);
    revalidatePath(`/clientes/${existing.clientId}/notas`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em unpayInvoice:", error);
    return { success: false, error: "Erro interno ao reverter status da nota." };
  }
}

export async function deleteInvoice(formData: FormData) {
  try {
    const invoiceId = sanitizeInput(formData.get("invoiceId") as string);
    if (!invoiceId) {
      return { success: false, error: "ID da nota não fornecido." };
    }

    const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!existing) {
      return { success: false, error: "Nota não encontrada." };
    }

    await prisma.invoice.delete({
      where: { id: invoiceId }
    });

    await logAction(
      "DELETE_CLIENT_NOTE",
      `Excluiu a nota/fatura '${existing.description || invoiceId}' do cliente ID ${existing.clientId}.`
    );

    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${existing.clientId}`);
    revalidatePath(`/clientes/${existing.clientId}/notas`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em deleteInvoice:", error);
    return { success: false, error: "Erro interno ao excluir nota." };
  }
}

export async function cancelInvoice(formData: FormData) {
  try {
    const invoiceId = sanitizeInput(formData.get("invoiceId") as string);
    const reason = sanitizeInput(formData.get("reason") as string);
    
    if (!invoiceId) {
      return { success: false, error: "ID da fatura não fornecido." };
    }

    if (!reason) {
      return { success: false, error: "O motivo do cancelamento é obrigatório." };
    }

    const existing = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "CANCELED",
        cancellationReason: reason
      }
    });

    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${existing.clientId}`);
    revalidatePath(`/clientes/${existing.clientId}/notas`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em cancelInvoice:", error);
    return { success: false, error: "Erro interno ao cancelar fatura." };
  }
}
