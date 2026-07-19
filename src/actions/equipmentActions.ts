"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";

export async function assignEquipment(formData: FormData) {
  const employeeId = sanitizeInput(formData.get("employeeId") as string);
  const productIds = formData.getAll("productId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const observationsList = formData.getAll("observations") as string[];

  if (!employeeId || !productIds || productIds.length === 0) {
    throw new Error("Funcionário e ao menos um produto são obrigatórios.");
  }

  // 1. Pré-validar estoque de todos os produtos e obter dados para o termo
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true }
  });
  if (!employee) {
    throw new Error("Funcionário não encontrado.");
  }

  const itemsTextList: string[] = [];

  for (let i = 0; i < productIds.length; i++) {
    const pId = productIds[i];
    const qty = parseInt(quantities[i], 10);

    if (!pId) {
      throw new Error(`Item ${i + 1}: Selecione um produto válido.`);
    }
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Item ${i + 1}: Informe uma quantidade válida maior que 0.`);
    }

    const product = await prisma.product.findUnique({ where: { id: pId } });
    if (!product) {
      throw new Error(`Item ${i + 1}: Produto não encontrado.`);
    }
    if (product.quantity < qty) {
      throw new Error(`Estoque insuficiente para o produto "${product.name}". Apenas ${product.quantity} disponíveis.`);
    }

    itemsTextList.push(`- ${qty}x ${product.name} (${product.unit})`);
  }

  // 2. Localizar ou criar o modelo do Termo de Retirada
  let template = await prisma.documentTemplate.findUnique({
    where: { type: "RETIRADA" }
  });

  if (!template) {
    template = await prisma.documentTemplate.create({
      data: {
        type: "RETIRADA",
        title: "Termo de Entrega e Responsabilidade de Materiais",
        content: `DECLARAÇÃO DE RECEBIMENTO DE EQUIPAMENTOS E MATERIAIS\n\nEu, {{nome_funcionario}}, portador do CPF nº {{cpf_funcionario}}, declaro para os devidos fins que recebi da empresa AERP os seguintes materiais/EPIs em perfeito estado de conservação:\n\n{{lista_itens}}\n\nComprometo-me a zelar pelo bom uso e conservação dos mesmos, sob pena de ressarcimento em caso de perda ou dano decorrente de uso inadequado.\n\nData: {{data}}`
      }
    });
  }

  // Preencher placeholders do Termo
  const dateFormatted = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const filledContent = template.content
    .replace("{{nome_funcionario}}", employee.user?.name || employee.firstName || "Terceirizado")
    .replace("{{cpf_funcionario}}", employee.cpf)
    .replace("{{lista_itens}}", itemsTextList.join("\n"))
    .replace("{{data}}", dateFormatted);

  // 3. Criar o documento assinado pendente
  const signedDoc = await prisma.signedDocument.create({
    data: {
      templateId: template.id,
      title: `${template.title} - ${employee.user?.name || employee.firstName}`,
      content: filledContent,
      status: "PENDING",
      employeeId: employeeId
    }
  });

  // 4. Gravar atribuições vinculadas ao documento e diminuir o estoque central
  for (let i = 0; i < productIds.length; i++) {
    const pId = productIds[i];
    const qty = parseInt(quantities[i], 10);
    const obs = sanitizeInput(observationsList[i] as string) || "";

    const product = await prisma.product.findUnique({ where: { id: pId } });
    if (!product) continue;

    // Criar a atribuição (cautela) vinculada ao termo gerado
    await prisma.employeeEquipment.create({
      data: {
        employeeId,
        productId: pId,
        quantity: qty,
        observations: obs,
        status: "EM USO",
        documentId: signedDoc.id
      }
    });

    // Debitar do estoque central
    await prisma.product.update({
      where: { id: pId },
      data: {
        quantity: product.quantity - qty
      }
    });
  }

  revalidatePath("/cautelas");
  revalidatePath("/estoque");
}

export async function returnEquipment(formData: FormData) {
  const equipmentId = sanitizeInput(formData.get("equipmentId") as string);
  const status = sanitizeInput(formData.get("status") as string);
  const returnObservations = sanitizeInput(formData.get("returnObservations") as string);
  
  if (!equipmentId || !status) {
    throw new Error("ID da atribuição e status de baixa são obrigatórios.");
  }

  const equipment = await prisma.employeeEquipment.findUnique({
    where: { id: equipmentId },
    include: { product: true }
  });

  if (!equipment || equipment.status !== "EM USO") {
    throw new Error("Esta atribuição não está ativa ou já foi devolvida.");
  }

  // Juntar as observações de entrega com as de devolução
  const finalObservations = [
    equipment.observations,
    returnObservations ? `[Baixa: ${returnObservations}]` : ""
  ].filter(Boolean).join(" | ");

  // 1. Atualizar o registro da atribuição
  await prisma.employeeEquipment.update({
    where: { id: equipmentId },
    data: {
      status,
      observations: finalObservations,
      returnedAt: new Date()
    }
  });

  // 2. Se status for "DEVOLVIDO", devolvemos pro estoque central (soma a quantidade)
  if (status === "DEVOLVIDO") {
    await prisma.product.update({
      where: { id: equipment.productId },
      data: {
        quantity: equipment.product.quantity + equipment.quantity
      }
    });
  }

  revalidatePath("/cautelas");
  revalidatePath("/estoque");
}
