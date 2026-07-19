"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import { logAction } from "@/lib/audit";

export async function createProduct(formData: FormData) {
  const name = sanitizeInput(formData.get("name") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const minQuantity = parseInt(formData.get("minQuantity") as string, 10);
  const unit = sanitizeInput(formData.get("unit") as string);
  
  const category = sanitizeInput(formData.get("category") as string);
  const size = sanitizeInput(formData.get("size") as string);
  const modelType = sanitizeInput(formData.get("modelType") as string);

  if (!name || isNaN(quantity)) {
    throw new Error("Nome e Quantidade são obrigatórios");
  }

  await prisma.product.create({
    data: {
      name,
      description,
      quantity: quantity || 0,
      minQuantity: minQuantity || 0,
      unit: unit || "un",
      category,
      size,
      modelType
    }
  });

  await logAction("CREATE_PRODUCT", `Cadastrou o produto '${name}' com quantidade inicial de ${quantity} ${unit || "un"}.Category: ${category}.`);

  revalidatePath("/estoque");
  redirect("/estoque");
}

export async function allocateProductToClient(formData: FormData) {
  const productId = sanitizeInput(formData.get("productId") as string);
  const clientId = sanitizeInput(formData.get("clientId") as string);
  const qtyStr = sanitizeInput(formData.get("quantity") as string);

  if (!productId || !clientId || !qtyStr) {
    throw new Error("Produto, Cliente e Quantidade são obrigatórios.");
  }

  const quantityToAllocate = parseInt(qtyStr, 10);
  if (isNaN(quantityToAllocate) || quantityToAllocate <= 0) {
    throw new Error("Informe uma quantidade válida superior a zero.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error("Produto não encontrado.");
  }

  if (product.quantity < quantityToAllocate) {
    throw new Error(`Quantidade insuficiente no estoque central (${product.quantity} ${product.unit} disponíveis).`);
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  // Executa a transferência de estoque em uma transação
  await prisma.$transaction([
    // Decrementa do estoque central
    prisma.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantityToAllocate } }
    }),
    // Incrementa ou cria a alocação no cliente
    prisma.inventoryAllocation.create({
      data: {
        productId,
        clientId,
        quantity: quantityToAllocate
      }
    })
  ]);

  await logAction("ALLOCATE_PRODUCT", `Alocou ${quantityToAllocate} ${product.unit} de '${product.name}' para o cliente '${client?.name || clientId}'.`);

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${productId}`);
}

export async function deallocateProductFromClient(formData: FormData) {
  const allocationId = sanitizeInput(formData.get("allocationId") as string);

  if (!allocationId) {
    throw new Error("ID de alocação inválido.");
  }

  const allocation = await prisma.inventoryAllocation.findUnique({
    where: { id: allocationId },
    include: { product: true }
  });

  if (!allocation) {
    throw new Error("Alocação não encontrada.");
  }

  const client = await prisma.client.findUnique({
    where: { id: allocation.clientId }
  });

  // Retorna a quantidade para o estoque central e deleta a alocação
  await prisma.$transaction([
    prisma.product.update({
      where: { id: allocation.productId },
      data: { quantity: { increment: allocation.quantity } }
    }),
    prisma.inventoryAllocation.delete({
      where: { id: allocationId }
    })
  ]);

  await logAction("DEALLOCATE_PRODUCT", `Retornou ${allocation.quantity} ${allocation.product.unit} de '${allocation.product.name}' do cliente '${client?.name || allocation.clientId}' para o estoque central.`);

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${allocation.productId}`);
}

export async function deleteProduct(formData: FormData) {
  const id = sanitizeInput(formData.get("productId") as string);
  if (!id) {
    throw new Error("ID de produto inválido.");
  }

  const product = await prisma.product.update({
    where: { id },
    data: { deleted: true }
  });

  await logAction("DELETE_PRODUCT", `Moveu o produto '${product.name}' (ID: ${id}) para a lixeira.`);

  revalidatePath("/estoque");
  revalidatePath("/lixeira");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = sanitizeInput(formData.get("name") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const minQuantity = parseInt(formData.get("minQuantity") as string, 10);
  const unit = sanitizeInput(formData.get("unit") as string);
  
  const category = sanitizeInput(formData.get("category") as string);
  const size = sanitizeInput(formData.get("size") as string);
  const modelType = sanitizeInput(formData.get("modelType") as string);

  if (!name || isNaN(quantity)) {
    throw new Error("Nome e Quantidade são obrigatórios");
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      quantity: quantity || 0,
      minQuantity: minQuantity || 0,
      unit: unit || "un",
      category,
      size,
      modelType
    }
  });

  await logAction("UPDATE_PRODUCT", `Atualizou o produto '${name}' (ID: ${id}).`);

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${id}`);
}
