"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import fs from "fs/promises";
import path from "path";

export async function createInvoice(formData: FormData) {
  const clientId = sanitizeInput(formData.get("clientId") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const amountStr = sanitizeInput(formData.get("amount") as string);
  const dueDateStr = sanitizeInput(formData.get("dueDate") as string);

  if (!clientId || !amountStr || !dueDateStr) {
    throw new Error("Cliente, Valor e Data de Vencimento são obrigatórios");
  }

  // Converter valor numérico e data
  const amount = parseFloat(amountStr.replace(",", "."));
  const dueDate = new Date(dueDateStr);

  // Processar arquivo de anexo, se houver
  const attachment = formData.get("attachment") as File;
  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (attachment && attachment.size > 0 && attachment.name) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const sanitizedFileName = sanitizeInput(attachment.name);
    const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await attachment.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    fileUrl = `/uploads/${filename}`;
    fileName = sanitizedFileName;
  }

  await prisma.invoice.create({
    data: {
      clientId,
      description,
      amount,
      dueDate,
      status: "PENDING",
      fileUrl,
      fileName
    }
  });

  revalidatePath("/financeiro");
  redirect("/financeiro");
}

export async function updateInvoice(id: string, formData: FormData) {
  const clientId = sanitizeInput(formData.get("clientId") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const amountStr = sanitizeInput(formData.get("amount") as string);
  const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
  const status = sanitizeInput(formData.get("status") as string);

  if (!clientId || !amountStr || !dueDateStr) {
    throw new Error("Cliente, Valor e Data de Vencimento são obrigatórios");
  }

  const amount = parseFloat(amountStr.replace(",", "."));
  const dueDate = new Date(dueDateStr);

  const dataToUpdate: any = {
    clientId,
    description,
    amount,
    dueDate,
    status
  };

  const attachment = formData.get("attachment") as File;
  if (attachment && attachment.size > 0 && attachment.name) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const sanitizedFileName = sanitizeInput(attachment.name);
    const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await attachment.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    dataToUpdate.fileUrl = `/uploads/${filename}`;
    dataToUpdate.fileName = sanitizedFileName;
  }

  await prisma.invoice.update({
    where: { id },
    data: dataToUpdate
  });

  revalidatePath("/financeiro");
  redirect("/financeiro");
}

export async function payInvoice(formData: FormData) {
  const invoiceId = sanitizeInput(formData.get("invoiceId") as string);
  
  if (!invoiceId) {
    throw new Error("ID da fatura não fornecido.");
  }

  const receiptFile = formData.get("receipt") as File;
  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const sanitizedFileName = sanitizeInput(receiptFile.name);
    const filename = `${Date.now()}-receipt-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await receiptFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    fileUrl = `/uploads/${filename}`;
    fileName = sanitizedFileName;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "PAID",
      ...(fileUrl ? { fileUrl, fileName } : {})
    }
  });

  revalidatePath("/financeiro");
}
