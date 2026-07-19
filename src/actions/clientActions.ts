"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import { logAction } from "@/lib/audit";

export async function createClient(formData: FormData) {
  // Obter e higienizar todos os inputs
  const companyName = sanitizeInput(formData.get("companyName") as string);
  const cnpj = sanitizeInput(formData.get("cnpj") as string);
  const address = sanitizeInput(formData.get("address") as string);
  
  const name = sanitizeInput(formData.get("name") as string);
  const city = sanitizeInput(formData.get("city") as string);
  const state = sanitizeInput(formData.get("state") as string);
  const cep = sanitizeInput(formData.get("cep") as string);
  const totalArea = sanitizeInput(formData.get("totalArea") as string);
  const phone = sanitizeInput(formData.get("phone") as string);
  const cellphone = sanitizeInput(formData.get("cellphone") as string);
  const email = sanitizeInput(formData.get("email") as string);
  const email2 = sanitizeInput(formData.get("email2") as string);
  const observations = sanitizeInput(formData.get("observations") as string);
  const managerName = sanitizeInput(formData.get("managerName") as string);
  const managerContact = sanitizeInput(formData.get("managerContact") as string);

  if (!companyName || !cnpj || !address) {
    throw new Error("Razão Social, CNPJ e Endereço são obrigatórios");
  }

  // Prevenir colisão de CNPJ
  const existingClient = await prisma.client.findUnique({
    where: { cnpj }
  });

  if (existingClient) {
    if (existingClient.deleted) {
      throw new Error("Já existe um cliente cadastrado com este CNPJ na Lixeira. Por favor, restaure-o ou informe outro CNPJ.");
    } else {
      throw new Error("Já existe um cliente cadastrado com este CNPJ.");
    }
  }

  await prisma.client.create({
    data: {
      companyName,
      cnpj,
      address,
      name,
      city,
      state,
      cep,
      totalArea,
      phone,
      cellphone,
      email,
      email2,
      observations,
      managerName,
      managerContact
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function deleteClient(formData: FormData) {
  const id = sanitizeInput(formData.get("clientId") as string);
  if (!id) {
    throw new Error("ID de cliente inválido.");
  }

  // TRAVA DE SEGURANÇA: Verificar se o cliente possui vínculos ativos
  const relations = await prisma.client.findUnique({
    where: { id },
    include: {
      jobAllocations: { where: { status: { not: "Cancelada" } } },
      inventory: true,
    }
  });

  if (relations) {
    if (relations.jobAllocations.length > 0) {
      throw new Error("Não é possível excluir este cliente pois ele possui escalas/alocações vinculadas a ele. Cancele-as primeiro.");
    }
    if (relations.inventory.length > 0) {
      throw new Error("Não é possível excluir este cliente pois ele possui itens de estoque (Inventory) vinculados a ele. Transfira os itens primeiro.");
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: { deleted: true }
  });

  await logAction("DELETE_CLIENT", `Moveu o cliente '${client.companyName}' (ID: ${id}) para a lixeira.`);

  revalidatePath("/clientes");
  revalidatePath("/lixeira");
}

export async function updateClient(clientId: string, formData: FormData) {
  const companyName = sanitizeInput(formData.get("companyName") as string);
  const cnpj = sanitizeInput(formData.get("cnpj") as string);
  const address = sanitizeInput(formData.get("address") as string);
  
  const name = sanitizeInput(formData.get("name") as string);
  const city = sanitizeInput(formData.get("city") as string);
  const state = sanitizeInput(formData.get("state") as string);
  const cep = sanitizeInput(formData.get("cep") as string);
  const totalArea = sanitizeInput(formData.get("totalArea") as string);
  const phone = sanitizeInput(formData.get("phone") as string);
  const cellphone = sanitizeInput(formData.get("cellphone") as string);
  const email = sanitizeInput(formData.get("email") as string);
  const email2 = sanitizeInput(formData.get("email2") as string);
  const observations = sanitizeInput(formData.get("observations") as string);
  const managerName = sanitizeInput(formData.get("managerName") as string);
  const managerContact = sanitizeInput(formData.get("managerContact") as string);

  if (!clientId || !companyName || !cnpj || !address) {
    throw new Error("Razão Social, CNPJ e Endereço são obrigatórios");
  }

  // Prevenir colisão de CNPJ
  const existingClient = await prisma.client.findFirst({
    where: {
      cnpj,
      NOT: { id: clientId }
    }
  });

  if (existingClient) {
    throw new Error("Este CNPJ já está cadastrado para outro cliente.");
  }

  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: {
      companyName,
      cnpj,
      address,
      name,
      city,
      state,
      cep,
      totalArea,
      phone,
      cellphone,
      email,
      email2,
      observations,
      managerName,
      managerContact
    }
  });

  await logAction("UPDATE_CLIENT", `Atualizou os dados do cliente '${updatedClient.companyName}' (ID: ${clientId}).`);

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  redirect("/clientes");
}
