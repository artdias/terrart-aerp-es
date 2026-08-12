"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import fs from "fs/promises";
import path from "path";

export async function createExpense(formData: FormData) {
  try {
    const description = sanitizeInput(formData.get("description") as string);
    const amountStr = sanitizeInput(formData.get("amount") as string);
    const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
    const category = sanitizeInput(formData.get("category") as string);
    const status = sanitizeInput(formData.get("status") as string) || "PENDING";
    
    const isInventoryItem = formData.get("isInventoryItem") === "true";
    const productId = sanitizeInput(formData.get("productId") as string);
    const quantityStr = sanitizeInput(formData.get("quantity") as string);

    if (!description || !amountStr || !dueDateStr || !category) {
      return { success: false, error: "Descrição, Valor, Vencimento e Categoria são obrigatórios." };
    }

    const amount = parseFloat(amountStr.replace(",", "."));
    const dueDate = new Date(dueDateStr);
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

    // 1. Processar arquivo da conta/nota fiscal (bill)
    const billFile = formData.get("bill") as File;
    let billUrl: string | null = null;
    let billName: string | null = null;

    if (billFile && billFile.size > 0 && billFile.name) {
      const sanitizedFileName = sanitizeInput(billFile.name);
      const buffer = Buffer.from(await billFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = billFile.type || "application/octet-stream";

      billUrl = `data:${mimeType};base64,${base64}`;
      billName = sanitizedFileName;
    }

    // 2. Processar arquivo do comprovante de pagamento (receipt)
    const receiptFile = formData.get("receipt") as File;
    let receiptUrl: string | null = null;
    let receiptName: string | null = null;

    if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
      const sanitizedFileName = sanitizeInput(receiptFile.name);
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = receiptFile.type || "application/octet-stream";

      receiptUrl = `data:${mimeType};base64,${base64}`;
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
          return { success: false, error: "Nome do produto é obrigatório para cadastrar um novo item no estoque." };
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
          return { success: false, error: "Produto selecionado não existe." };
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
    return { success: true };
  } catch (error: any) {
    console.error("Erro em createExpense:", error);
    return { success: false, error: "Ocorreu um erro interno ao tentar salvar a despesa." };
  }
}

export async function payExpense(formData: FormData) {
  try {
    const expenseId = sanitizeInput(formData.get("expenseId") as string);
    
    if (!expenseId) {
      return { success: false, error: "ID da despesa não fornecido." };
    }

    // Processar comprovante opcional enviado na baixa
    const receiptFile = formData.get("receipt") as File;
    let receiptUrl: string | null = null;
    let receiptName: string | null = null;

    if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
      const sanitizedFileName = sanitizeInput(receiptFile.name);
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = receiptFile.type || "application/octet-stream";

      receiptUrl = `data:${mimeType};base64,${base64}`;
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
    return { success: true };
  } catch (error: any) {
    console.error("Erro em payExpense:", error);
    return { success: false, error: "Ocorreu um erro interno ao processar a baixa da despesa." };
  }
}

export async function updateExpense(id: string, formData: FormData) {
  try {
    const description = sanitizeInput(formData.get("description") as string);
    const amountStr = sanitizeInput(formData.get("amount") as string);
    const dueDateStr = sanitizeInput(formData.get("dueDate") as string);
    const category = sanitizeInput(formData.get("category") as string);
    const status = sanitizeInput(formData.get("status") as string);

    if (!description || !amountStr || !dueDateStr || !category) {
      return { success: false, error: "Descrição, Valor, Vencimento e Categoria são obrigatórios." };
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

    const billFile = formData.get("bill") as File;
    if (billFile && billFile.size > 0 && billFile.name) {
      const sanitizedFileName = sanitizeInput(billFile.name);
      const buffer = Buffer.from(await billFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = billFile.type || "application/octet-stream";

      dataToUpdate.billUrl = `data:${mimeType};base64,${base64}`;
      dataToUpdate.billName = sanitizedFileName;
    }

    const receiptFile = formData.get("receipt") as File;
    if (receiptFile && receiptFile.size > 0 && receiptFile.name) {
      const sanitizedFileName = sanitizeInput(receiptFile.name);
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = receiptFile.type || "application/octet-stream";

      dataToUpdate.receiptUrl = `data:${mimeType};base64,${base64}`;
      dataToUpdate.receiptName = sanitizedFileName;
    }

    await prisma.expense.update({
      where: { id },
      data: dataToUpdate
    });

    revalidatePath("/financeiro");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateExpense:", error);
    return { success: false, error: "Ocorreu um erro interno ao tentar atualizar a despesa." };
  }
}
