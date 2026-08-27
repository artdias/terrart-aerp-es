"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function generateAdmissionContract(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowRh)) {
    throw new Error("Sem permissão para RH.");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });

  if (!employee) throw new Error("Funcionário não encontrado.");

  let template = await prisma.documentTemplate.findUnique({
    where: { type: "ADMISSAO" }
  });

  if (!template) {
    // Cria um template padrão caso não exista
    template = await prisma.documentTemplate.create({
      data: {
        type: "ADMISSAO",
        title: "Contrato de Trabalho e Admissão",
        content: `CONTRATO INDIVIDUAL DE TRABALHO\n\nEmpregador: AERP SISTEMAS.\nEmpregado: {{nome_funcionario}}, CPF nº {{cpf_funcionario}}.\n\nO Empregado é admitido para exercer a função de {{cargo}}.\n\nData de Admissão: {{data}}\n\nDeclaro estar de acordo com os termos deste contrato.`
      }
    });
  }

  let content = template.content;
  content = content.replace(/{{nome_funcionario}}/g, employee.firstName + (employee.lastName ? ` ${employee.lastName}` : ""));
  content = content.replace(/{{cpf_funcionario}}/g, employee.cpf);
  content = content.replace(/{{cargo}}/g, employee.roleTitle || "");
  content = content.replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'));

  const doc = await prisma.signedDocument.create({
    data: {
      templateId: template.id,
      employeeId: employee.id,
      title: `Contrato de Admissão - ${employee.firstName}`,
      content: content,
      status: "PENDING"
    }
  });

  await logAction("GERAR_ADMISSAO", `Gerou contrato de admissão para ${employee.firstName} (${employee.cpf}).`);
  
  revalidatePath("/rh/admissao");
  revalidatePath(`/rh/admissao/${employee.id}`);
  return { success: true, documentId: doc.id };
}

export async function confirmAdmission(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowRh)) {
    throw new Error("Sem permissão para RH.");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { documents: { where: { template: { type: "ADMISSAO" }, status: "SIGNED" } } }
  });

  if (!employee) throw new Error("Funcionário não encontrado.");

  if (employee.documents.length === 0) {
    throw new Error("Nenhum contrato de admissão assinado foi encontrado.");
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "Ativo" }
  });

  await logAction("EFETIVAR_ADMISSAO", `Admissão efetivada para ${employee.firstName} (${employee.cpf}). Status atualizado para Ativo.`);

  revalidatePath("/rh");
  revalidatePath("/funcionarios");
  redirect("/rh");
}

export async function generateDismissalContract(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowRh)) {
    throw new Error("Sem permissão para RH.");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });

  if (!employee) throw new Error("Funcionário não encontrado.");

  let template = await prisma.documentTemplate.findUnique({
    where: { type: "DEMISSAO" }
  });

  if (!template) {
    // Cria um template padrão caso não exista
    template = await prisma.documentTemplate.create({
      data: {
        type: "DEMISSAO",
        title: "Termo de Rescisão de Contrato de Trabalho",
        content: `TERMO DE RESCISÃO\n\nEmpregador: AERP SISTEMAS.\nEmpregado: {{nome_funcionario}}, CPF nº {{cpf_funcionario}}.\nCargo: {{cargo}}\n\nAs partes resolvem de comum acordo encerrar o vínculo empregatício na presente data.\n\nData de Demissão: {{data}}\n\nO Empregado dá plena quitação das verbas rescisórias recebidas.`
      }
    });
  }

  let content = template.content;
  content = content.replace(/{{nome_funcionario}}/g, employee.firstName + (employee.lastName ? ` ${employee.lastName}` : ""));
  content = content.replace(/{{cpf_funcionario}}/g, employee.cpf);
  content = content.replace(/{{cargo}}/g, employee.roleTitle || "");
  content = content.replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'));

  const doc = await prisma.signedDocument.create({
    data: {
      templateId: template.id,
      employeeId: employee.id,
      title: `Distrato / Demissão - ${employee.firstName}`,
      content: content,
      status: "PENDING"
    }
  });

  await logAction("GERAR_DEMISSAO", `Gerou contrato de demissão para ${employee.firstName} (${employee.cpf}).`);
  
  revalidatePath("/rh/demissao");
  revalidatePath(`/rh/demissao/${employee.id}`);
  return { success: true, documentId: doc.id };
}

export async function confirmDismissal(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowRh)) {
    throw new Error("Sem permissão para RH.");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { documents: { where: { template: { type: "DEMISSAO" }, status: "SIGNED" } } }
  });

  if (!employee) throw new Error("Funcionário não encontrado.");

  if (employee.documents.length === 0) {
    throw new Error("Nenhum contrato de demissão assinado foi encontrado.");
  }

  // 1. Muda o status para Inativo
  // 2. Remove da alocação de posto principal
  await prisma.employee.update({
    where: { id: employeeId },
    data: { 
      status: "Inativo",
      workplaceId: null
    }
  });

  // 3. Cancela todas as alocações ativas (JobAllocation)
  await prisma.jobAllocation.updateMany({
    where: { 
      employeeId: employeeId,
      status: { in: ["Ativa", "Pendente"] }
    },
    data: { status: "Cancelada" }
  });

  await logAction("EFETIVAR_DEMISSAO", `Demissão efetivada para ${employee.firstName} (${employee.cpf}). Postos liberados.`);

  revalidatePath("/rh");
  revalidatePath("/funcionarios");
  redirect("/rh");
}
