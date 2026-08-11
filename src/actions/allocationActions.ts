"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";

export async function createAllocation(formData: FormData) {
  try {
    const employeeId = sanitizeInput(formData.get("employeeId") as string);
    const clientId = sanitizeInput(formData.get("clientId") as string);
    const task = sanitizeInput(formData.get("task") as string);
    const duration = sanitizeInput(formData.get("duration") as string);
    const paymentValueStr = sanitizeInput(formData.get("paymentValue") as string);
    const paymentFrequency = sanitizeInput(formData.get("paymentFrequency") as string);
    
    const startDateStr = sanitizeInput(formData.get("startDate") as string);
    const endDateStr = sanitizeInput(formData.get("endDate") as string);

    if (!employeeId || !clientId || !task || !paymentValueStr || !startDateStr || !endDateStr) {
      return { success: false, error: "Funcionário, Cliente, Tarefa, Valor, Início e Término são obrigatórios." };
    }

    const paymentValue = parseFloat(paymentValueStr.replace(",", "."));
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate >= endDate) {
      return { success: false, error: "A data de término deve ser posterior à data de início." };
    }

    // Validação de Conflito de Agenda
    const conflict = await prisma.jobAllocation.findFirst({
      where: {
        employeeId,
        status: { not: "Cancelada" },
        concludedAt: null,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      }
    });

    if (conflict) {
      return { success: false, error: "Conflito de Agenda: Este funcionário já possui uma alocação ativa neste mesmo horário." };
    }

    await prisma.jobAllocation.create({
      data: {
        employeeId,
        clientId,
        task,
        duration,
        paymentValue,
        paymentFrequency,
        status: "Ativa",
        startDate,
        endDate
      }
    });

    revalidatePath("/escalas");
    return { success: true };
  } catch (error: any) {
    console.error("Erro em createAllocation:", error);
    return { success: false, error: "Ocorreu um erro interno ao tentar salvar a escala." };
  }
}

export async function updateAllocation(allocationId: string, formData: FormData) {
  try {
    const employeeId = sanitizeInput(formData.get("employeeId") as string);
    const clientId = sanitizeInput(formData.get("clientId") as string);
    const task = sanitizeInput(formData.get("task") as string);
    const duration = sanitizeInput(formData.get("duration") as string);
    const paymentValueStr = sanitizeInput(formData.get("paymentValue") as string);
    const paymentFrequency = sanitizeInput(formData.get("paymentFrequency") as string);
    const status = sanitizeInput(formData.get("status") as string);

    const startDateStr = sanitizeInput(formData.get("startDate") as string);
    const endDateStr = sanitizeInput(formData.get("endDate") as string);

    if (!employeeId || !clientId || !task || !paymentValueStr || !startDateStr || !endDateStr) {
      return { success: false, error: "Funcionário, Cliente, Tarefa, Valor, Início e Término são obrigatórios." };
    }

    const paymentValue = parseFloat(paymentValueStr.replace(",", "."));
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate >= endDate) {
      return { success: false, error: "A data de término deve ser posterior à data de início." };
    }

    // Validação de Conflito de Agenda (ignorando a própria alocação)
    const conflict = await prisma.jobAllocation.findFirst({
      where: {
        id: { not: allocationId },
        employeeId,
        status: { not: "Cancelada" },
        concludedAt: null,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      }
    });

    if (conflict) {
      return { success: false, error: "Conflito de Agenda: Este funcionário já possui uma alocação ativa neste mesmo horário." };
    }

    await prisma.jobAllocation.update({
      where: { id: allocationId },
      data: {
        employeeId,
        clientId,
        task,
        duration,
        paymentValue,
        paymentFrequency,
        status: status || "Ativa",
        startDate,
        endDate
      }
    });

    revalidatePath("/escalas");
    revalidatePath(`/escalas/${allocationId}`);
    revalidatePath(`/funcionarios/${employeeId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateAllocation:", error);
    return { success: false, error: "Ocorreu um erro interno ao tentar atualizar a escala." };
  }
}

export async function concludeAllocation(allocationId: string) {
  if (!allocationId) throw new Error("ID inválido");

  await prisma.jobAllocation.update({
    where: { id: allocationId },
    data: {
      concludedAt: new Date(),
    }
  });

  revalidatePath("/escalas");
  revalidatePath(`/escalas/${allocationId}`);
}

export async function cancelAllocation(allocationId: string, formData: FormData) {
  if (!allocationId) throw new Error("ID inválido");
  
  const reason = sanitizeInput(formData.get("cancellationReason") as string);
  if (!reason) {
    throw new Error("O motivo do cancelamento é obrigatório.");
  }

  await prisma.jobAllocation.update({
    where: { id: allocationId },
    data: {
      status: "Cancelada",
      cancellationReason: reason,
    }
  });

  revalidatePath("/escalas");
  revalidatePath(`/escalas/${allocationId}`);
}
