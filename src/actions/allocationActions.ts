"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";

// Função auxiliar para verificar conflito inteligente de agenda
async function checkScheduleConflict(
  employeeId: string, 
  newStart: Date | null, 
  newEnd: Date | null, 
  newScaleMode: string,
  ignoreAllocationId?: string
): Promise<string | null> {
  const activeAllocations = await prisma.jobAllocation.findMany({
    where: {
      employeeId,
      status: { not: "Cancelada" },
      concludedAt: null,
      ...(ignoreAllocationId ? { id: { not: ignoreAllocationId } } : {})
    }
  });

  if (activeAllocations.length === 0) return null;

  for (const alloc of activeAllocations) {
    const allocStart = alloc.startDate;
    const allocEnd = alloc.endDate;
    const allocMode = alloc.scaleMode || "Contínuo";

    // 1. Conflito Direto (Ambos têm data fixa ou contínuo)
    if (newStart && allocStart && allocMode === "Contínuo" && newScaleMode === "Contínuo") {
      const isOverlap = (!newEnd || newEnd > allocStart) && (!allocEnd || allocEnd > newStart);
      if (isOverlap) return "Conflito de Agenda: Este funcionário já possui uma alocação ativa (Contínua) nesse período.";
    }

    // 2. Conflito 12x36 (O sistema avalia se o novo trabalho cai no dia de trabalho ou folga)
    if (allocMode === "12x36" && allocStart && newStart) {
      // Cálculo: A cada 48h (1000 * 60 * 60 * 48 ms), os primeiros 12h são trabalho.
      const ms48h = 48 * 60 * 60 * 1000;
      const ms12h = 12 * 60 * 60 * 1000;
      
      const diffStart = newStart.getTime() - allocStart.getTime();
      const diffEnd = newEnd ? newEnd.getTime() - allocStart.getTime() : diffStart + ms12h; // Se não tem fim, assume 12h
      
      if (diffEnd > 0) {
        // Encontra o ciclo (k) para o início e para o fim
        const kStart = Math.floor(diffStart / ms48h);
        const kEnd = Math.floor(diffEnd / ms48h);
        
        for (let k = kStart; k <= kEnd; k++) {
          const shiftStart = k * ms48h;
          const shiftEnd = shiftStart + ms12h;
          
          // Verifica overlap entre [diffStart, diffEnd] e [shiftStart, shiftEnd]
          if (diffEnd > shiftStart && diffStart < shiftEnd) {
            return "Conflito com escala 12x36: A nova alocação cai em um dia/horário de trabalho da escala 12x36 existente.";
          }
        }
      }
    }
    
    // Regra simples para outras escalas (se bater, avisa, exceto se for "Livre" ou "Dias Alternados")
    // Se nenhum tem data, mas ambos não são "Livres", podemos dar um aviso genérico
    if (!newStart && !allocStart && allocMode !== "Livre" && newScaleMode !== "Livre") {
       // Permite por enquanto, confiando no usuário para escalas flexíveis
    }
  }

  return null;
}

export async function createAllocation(formData: FormData) {
  try {
    const employeeId = sanitizeInput(formData.get("employeeId") as string);
    const clientId = sanitizeInput(formData.get("clientId") as string);
    const task = sanitizeInput(formData.get("task") as string);
    const duration = sanitizeInput(formData.get("duration") as string);
    const scaleMode = sanitizeInput(formData.get("scaleMode") as string) || "Contínuo";
    const paymentValueStr = sanitizeInput(formData.get("paymentValue") as string);
    const paymentFrequency = sanitizeInput(formData.get("paymentFrequency") as string);
    
    const startDateStr = sanitizeInput(formData.get("startDate") as string);
    const endDateStr = sanitizeInput(formData.get("endDate") as string);

    if (!employeeId || !clientId || !task || !paymentValueStr) {
      return { success: false, error: "Funcionário, Cliente, Tarefa e Valor são obrigatórios." };
    }

    if (scaleMode === "12x36" && !startDateStr) {
      return { success: false, error: "Para o regime 12x36, a Data/Hora de Início é obrigatória." };
    }

    const paymentValue = parseFloat(paymentValueStr.replace(",", "."));
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    if (startDate && endDate && startDate >= endDate) {
      return { success: false, error: "A data de término deve ser posterior à data de início." };
    }

    const conflictError = await checkScheduleConflict(employeeId, startDate, endDate, scaleMode);
    if (conflictError) {
      return { success: false, error: conflictError };
    }

    await prisma.jobAllocation.create({
      data: {
        employeeId,
        clientId,
        task,
        duration,
        scaleMode,
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
    const scaleMode = sanitizeInput(formData.get("scaleMode") as string) || "Contínuo";
    const paymentValueStr = sanitizeInput(formData.get("paymentValue") as string);
    const paymentFrequency = sanitizeInput(formData.get("paymentFrequency") as string);
    const status = sanitizeInput(formData.get("status") as string);

    const startDateStr = sanitizeInput(formData.get("startDate") as string);
    const endDateStr = sanitizeInput(formData.get("endDate") as string);

    if (!employeeId || !clientId || !task || !paymentValueStr) {
      return { success: false, error: "Funcionário, Cliente, Tarefa e Valor são obrigatórios." };
    }

    if (scaleMode === "12x36" && !startDateStr) {
      return { success: false, error: "Para o regime 12x36, a Data/Hora de Início é obrigatória." };
    }

    const paymentValue = parseFloat(paymentValueStr.replace(",", "."));
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    if (startDate && endDate && startDate >= endDate) {
      return { success: false, error: "A data de término deve ser posterior à data de início." };
    }

    const conflictError = await checkScheduleConflict(employeeId, startDate, endDate, scaleMode, allocationId);
    if (conflictError) {
      return { success: false, error: conflictError };
    }

    await prisma.jobAllocation.update({
      where: { id: allocationId },
      data: {
        employeeId,
        clientId,
        task,
        duration,
        scaleMode,
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
