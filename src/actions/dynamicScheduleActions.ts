"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addManualShift(scheduleId: string, employeeId: string, dateStr: string, shiftId: string, workplaceId: string, roleOverride?: string) {
  // dateStr vem no formato YYYY-MM-DD
  const [year, month, day] = dateStr.split("-").map(Number);
  
  // Como as datas no prisma estão armazenadas (geralmente usamos meio-dia UTC para evitar fuso horário)
  // No generator original: pStart.setUTCHours(sh + 3, sm, 0, 0); 
  // Mas a data base do assignment (date) era UTC.
  const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // Limites do dia para checar conflitos reais (00h às 23:59h)
  const startOfDay = new Date(`${dateStr}T00:00:00Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59Z`);

  // Validação 1: Duplicidade no mesmo dia
  const existingShift = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: { workplace: true }
  });

  if (existingShift) {
    throw new Error(`Funcionário já está escalado neste dia no posto: ${existingShift.workplace.name}`);
  }

  // Validação 2: Cobertura de terceiros no mesmo dia
  const existingCoverage = await prisma.coverage.findFirst({
    where: {
      substituteEmployeeId: employeeId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: { assignment: { include: { workplace: true } } }
  });

  if (existingCoverage) {
    throw new Error(`Funcionário já está fazendo cobertura neste dia no posto: ${existingCoverage.assignment.workplace.name}`);
  }

  // Validação 3: Ocorrências (Atestados / Faltas Integrais)
  const existingOccurrence = await prisma.occurrence.findFirst({
    where: {
      employeeId,
      type: { in: ["ATESTADO", "FALTA_INTEGRAL", "ABANDONO"] },
      assignment: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }
  });

  if (existingOccurrence) {
    throw new Error(`Funcionário possui uma ocorrência impeditiva registrada neste dia (${existingOccurrence.type}).`);
  }

  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new Error("Turno não encontrado");
  
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Escala não encontrada");

  // Calcular horários exatos
  const pStart = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const [sh, sm] = shift.startTime.split(":").map(Number);
  pStart.setUTCHours(sh + 3, sm, 0, 0); // Ajuste UTC-3 basico (Brasil)

  const pEnd = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const [eh, em] = shift.endTime.split(":").map(Number);
  pEnd.setUTCHours(eh + 3, em, 0, 0);
  
  if (shift.crossesMidnight) {
    pEnd.setDate(pEnd.getDate() + 1);
  }

  await prisma.shiftAssignment.create({
    data: {
      scheduleId,
      employeeId,
      workplaceId,
      shiftId,
      date: targetDate,
      plannedStart: pStart,
      plannedEnd: pEnd,
      competencyMonth: schedule.competencyMonth,
      status: "PLANEJADO",
      roleOverride
    }
  });

  revalidatePath(`/escalas/planejamento/${scheduleId}`);
}

export async function removeManualShift(assignmentId: string, scheduleId: string) {
  await prisma.shiftAssignment.delete({ where: { id: assignmentId } });
  revalidatePath(`/escalas/planejamento/${scheduleId}`);
}

// Helper para buscar empregados e turnos para o modal
export async function getDropdownDataForGrid() {
  const employees = await prisma.employee.findMany({
    where: { status: "Ativo", deleted: false },
    include: { user: true },
    orderBy: { firstName: 'asc' }
  });

  const shifts = await prisma.shift.findMany({
    orderBy: { startTime: 'asc' }
  });

  return { employees, shifts };
}
