"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";

export async function saveTemplate(formData: FormData) {
  const id = sanitizeInput(formData.get("id") as string);
  const title = sanitizeInput(formData.get("title") as string);
  const content = formData.get("content") as string; // Não higienizar completamente para preservar tags e parágrafos

  if (!id || !title || !content) {
    throw new Error("ID, Título e Conteúdo são obrigatórios.");
  }

  await prisma.documentTemplate.update({
    where: { id },
    data: {
      title,
      content
    }
  });

  revalidatePath("/juridico");
  redirect("/juridico");
}

export async function signDocument(formData: FormData) {
  const documentId = sanitizeInput(formData.get("documentId") as string);
  const signatureType = sanitizeInput(formData.get("signatureType") as string); // "DRAWING" ou "ELECTRONIC"

  if (!documentId || !signatureType) {
    throw new Error("ID do documento e tipo de assinatura são obrigatórios.");
  }

  const document = await prisma.signedDocument.findUnique({
    where: { id: documentId }
  });

  if (!document) {
    throw new Error("Documento não encontrado.");
  }
  if (document.status === "SIGNED") {
    throw new Error("Este documento já foi assinado.");
  }

  if (signatureType === "DRAWING") {
    const signatureImage = formData.get("signatureImage") as string; // base64 do canvas
    if (!signatureImage || !signatureImage.startsWith("data:image")) {
      throw new Error("Assinatura desenhada inválida ou em branco.");
    }

    await prisma.signedDocument.update({
      where: { id: documentId },
      data: {
        status: "SIGNED",
        signatureType: "DRAWING",
        signatureImage,
        signedAt: new Date()
      }
    });
  } else {
    const signerCpf = sanitizeInput(formData.get("signerCpf") as string);
    const signerName = sanitizeInput(formData.get("signerName") as string);

    if (!signerCpf || !signerName) {
      throw new Error("Nome e CPF são obrigatórios para a assinatura eletrônica.");
    }

    await prisma.signedDocument.update({
      where: { id: documentId },
      data: {
        status: "SIGNED",
        signatureType: "ELECTRONIC",
        signerCpf,
        signerName,
        signedAt: new Date()
      }
    });
  }

  revalidatePath("/cautelas");
  revalidatePath("/juridico");
  redirect(`/assinar/concluido`);
}

export async function createClientDocument(formData: FormData) {
  const clientId = sanitizeInput(formData.get("clientId") as string);
  const title = sanitizeInput(formData.get("title") as string);
  const content = formData.get("content") as string;

  if (!clientId || !title || !content) {
    throw new Error("Cliente, Título e Conteúdo do contrato são obrigatórios.");
  }

  let template = await prisma.documentTemplate.findUnique({
    where: { type: "CONTRATO_CLIENTE" }
  });

  if (!template) {
    template = await prisma.documentTemplate.create({
      data: {
        type: "CONTRATO_CLIENTE",
        title: "Contrato de Prestação de Serviços",
        content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TERCEIRIZAÇÃO\n\nContratante: {{nome_cliente}}, CNPJ nº {{cnpj_cliente}}, sediada em {{endereco_cliente}}.\n\nContratada: AERP - SISTEMA WEB DE GESTÃO.\n\nObjeto: Prestação de serviços de mão de obra terceirizada conforme as escalas e alocações definidas no sistema.\n\nData: {{data}}`
      }
    });
  }

  await prisma.signedDocument.create({
    data: {
      templateId: template.id,
      title,
      content,
      status: "PENDING",
      clientId
    }
  });

  revalidatePath("/juridico");
  redirect("/juridico");
}
