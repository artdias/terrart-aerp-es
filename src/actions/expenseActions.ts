"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import fs from "fs/promises";
import path from "path";

export async function createExpense(formData: FormData) {
  const description = sanitizeInput(formData.get("description") as string);
  const amountStr = sanitizeInput(formData.get("amount") as string);
  const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
  const category = sanitizeInput(formData.get("category") as string);
  const status = sanitizeInput(formData.get("status") as string) || "PENDING";
  
  const isInventoryItem = formData.get("isInventoryItem") === "true";
  const productId = sanitizeInput(formData.get("productId") as string);
  const quantityStr = sanitizeInput(formData.get("quantity") as string);

  if (!description || !amountStr || !dueDateStr || !category) {
    throw new Error("Descrição, Valor, Vencimento e Categoria são obrigatórios.");
  }

  const amount = parseFloat(amountStr.replace(",", "."));
  const dueDate = new Date(dueDateStr);
  const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  // 1. Processar arquivo da conta/nota fiscal (bill)
  const billFile = formData.get("bill") as File;
  let billUrl: string | null = null;
  let billName: string | null = null;

  if (billFile && billFile.size > 0 && billFile.name) {
    const sanitizedFileName = sanitizeInput(billFile.name);
    const filename = `${Date.now()}-bill-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await billFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    billUrl = `/uploads/${filename}`;
    billName = sanitizedFileName;
  }

  // 2. Processar arquivo do comprovante de pagamento (receipt)
  const receiptFile = formData.get("receipt") as File;
  let receiptUrl: string | null = null;
  let receiptName: string | null = null;

  if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
    const sanitizedFileName = sanitizeInput(receiptFile.name);
    const filename = `${Date.now()}-receipt-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await receiptFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    receiptUrl = `/uploads/${filename}`;
    receiptName = sanitizedFileName;
  }

  // 3. Processar integração com Estoque
  let finalProductId: string | null = null;

  if (isInventoryItem && quantity > 0) {
    if (productId === "NEW") {
      // Cadastrar um novo item no estoque central
      const productName = sanitizeInput(formData.get("productName") as string);
      const productCategory = sanitizeInput(formData.get("productCategory") as string) || "Outro";
      const productUnit = sanitizeInput(formData.get("productUnit") as string) || "un";
      const productMinQuantityStr = sanitizeInput(formData.get("productMinQuantity") as string);
      const productMinQuantity = productMinQuantityStr ? parseInt(productMinQuantityStr, 10) : 5;

      if (!productName) {
        throw new Error("Nome do produto é obrigatório para cadastrar um novo item no estoque.");
      }

      const newProduct = await prisma.product.create({
        data: {
          name: productName,
          category: productCategory,
          unit: productUnit,
          minQuantity: productMinQuantity,
          quantity: quantity, // quantidade inicial comprada
          price: amount / quantity // calcula o preço unitário aproximado
        }
      });
      finalProductId = newProduct.id;
    } else if (productId && productId !== "") {
      // Incrementar estoque de item existente
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error("Produto selecionado não existe.");
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: product.quantity + quantity,
          price: amount / quantity // atualiza o preço médio/unitário
        }
      });
      finalProductId = productId;
    }
  }

  // 4. Gravar a Despesa no Banco
  await prisma.expense.create({
    data: {
      description,
      amount,
      dueDate,
      status,
      category,
      billUrl,
      billName,
      receiptUrl,
      receiptName,
      isInventoryItem,
      productId: finalProductId,
      quantity: isInventoryItem ? quantity : null
    }
  });

  revalidatePath("/financeiro");
  revalidatePath("/estoque");
  redirect("/financeiro?tab=despesas");
}

export async function payExpense(formData: FormData) {
  const expenseId = sanitizeInput(formData.get("expenseId") as string);
  
  if (!expenseId) {
    throw new Error("ID da despesa não fornecido.");
  }

  // Processar comprovante opcional enviado na baixa
  const receiptFile = formData.get("receipt") as File;
  let receiptUrl: string | null = null;
  let receiptName: string | null = null;

  if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const sanitizedFileName = sanitizeInput(receiptFile.name);
    const filename = `${Date.now()}-receipt-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await receiptFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    receiptUrl = `/uploads/${filename}`;
    receiptName = sanitizedFileName;
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: "PAID",
      ...(receiptUrl ? { receiptUrl, receiptName } : {})
    }
  });

  revalidatePath("/financeiro");
}

export async function updateExpense(id: string, formData: FormData) {
  const description = sanitizeInput(formData.get("description") as string);
  const amountStr = sanitizeInput(formData.get("amount") as string);
  const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
  const category = sanitizeInput(formData.get("category") as string);
  const status = sanitizeInput(formData.get("status") as string);

  if (!description || !amountStr || !dueDateStr || !category) {
    throw new Error("Descrição, Valor, Vencimento e Categoria são obrigatórios.");
  }

  const amount = parseFloat(amountStr.replace(",", "."));
  const dueDate = new Date(dueDateStr);

  const dataToUpdate: any = {
    description,
    amount,
    dueDate,
    category,
    status
  };

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const billFile = formData.get("bill") as File;
  if (billFile && billFile.size > 0 && billFile.name) {
    const sanitizedFileName = sanitizeInput(billFile.name);
    const filename = `${Date.now()}-bill-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await billFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    dataToUpdate.billUrl = `/uploads/${filename}`;
    dataToUpdate.billName = sanitizedFileName;
  }

  const receiptFile = formData.get("receipt") as File;
  if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
    const sanitizedFileName = sanitizeInput(receiptFile.name);
    const filename = `${Date.now()}-receipt-${sanitizedFileName.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await receiptFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    dataToUpdate.receiptUrl = `/uploads/${filename}`;
    dataToUpdate.receiptName = sanitizedFileName;
  }

  await prisma.expense.update({
    where: { id },
    data: dataToUpdate
  });

  revalidatePath("/financeiro");
  redirect("/financeiro?tab=despesas");
}
