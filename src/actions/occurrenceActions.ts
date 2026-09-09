"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OccurrenceType, WorkPeriodType } from "@prisma/client";

export async function getAssignmentsByDate(dateStr: string) {
  // dateStr in "YYYY-MM-DD"
  const startOfDay = new Date(`${dateStr}T00:00:00Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59Z`);

  return prisma.shiftAssignment.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      employee: { include: { user: true } },
      workplace: true,
      shift: true,
      occurrences: true,
      coverages: { include: { substituteEmployee: { include: { user: true } } } },
      workPeriods: true
    },
    orderBy: {
      workplace: { name: 'asc' }
    }
  });
}

export async function registerOccurrence(formData: FormData) {
  const assignmentId = formData.get("assignmentId") as string;
  const employeeId = formData.get("employeeId") as string;
  const type = formData.get("type") as OccurrenceType;
  const description = formData.get("description") as string;

  if (!assignmentId || !employeeId || !type) {
    throw new Error("Dados inválidos para registrar ocorrência.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Cria a Ocorrência
    await tx.occurrence.create({
      data: {
        assignmentId,
        employeeId,
        type,
        description,
        status: "PENDENTE"
      }
    });

    // 2. Atualiza o status do Assignment para refletir a ocorrência principal
    let newStatus = "REALIZADO_PARCIAL";
    if (type === "FALTA_INTEGRAL" || type === "ATESTADO" || type === "ABANDONO") {
      newStatus = "FALTA";
    }

    await tx.shiftAssignment.update({
      where: { id: assignmentId },
      data: { status: newStatus as any }
    });
  });

  revalidatePath("/escalas/ocorrencias");
}

export async function registerCoverage(formData: FormData) {
  const assignmentId = formData.get("assignmentId") as string;
  const originalEmployeeId = formData.get("originalEmployeeId") as string;
  const substituteEmployeeId = formData.get("substituteEmployeeId") as string;
  const customStartTime = formData.get("startTime") as string;
  const customEndTime = formData.get("endTime") as string;
  const reason = formData.get("reason") as string;
  
  if (!assignmentId || !originalEmployeeId || !substituteEmployeeId) {
    throw new Error("Dados de substituição inválidos.");
  }

  // Pegamos os detalhes do plantão original para copiar os horários
  const assignment = await prisma.shiftAssignment.findUnique({ where: { id: assignmentId }, include: { shift: true } });
  if (!assignment) throw new Error("Plantão não encontrado.");

  let coverageStart = assignment.plannedStart;
  let coverageEnd = assignment.plannedEnd;

  if (customStartTime && customEndTime) {
    const year = assignment.date.getUTCFullYear();
    const month = assignment.date.getUTCMonth();
    const day = assignment.date.getUTCDate();

    coverageStart = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const [sh, sm] = customStartTime.split(":").map(Number);
    coverageStart.setUTCHours(sh + 3, sm, 0, 0);

    coverageEnd = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const [eh, em] = customEndTime.split(":").map(Number);
    coverageEnd.setUTCHours(eh + 3, em, 0, 0);

    if (assignment.shift.crossesMidnight || (sh > eh)) {
      coverageEnd.setDate(coverageEnd.getDate() + 1);
    }
  }

  await prisma.$transaction(async (tx) => {
    // 1. Cria a cobertura
    await tx.coverage.create({
      data: {
        assignmentId,
        originalEmployeeId,
        substituteEmployeeId,
        startTime: coverageStart,
        endTime: coverageEnd,
        reason: reason || null,
        status: "PENDENTE"
      }
    });

    // 2. Atualiza o assignment para COBERTO (ou REALIZADO_PARCIAL se a cobertura não for do turno inteiro, mas por simplificação COBERTO)
    await tx.shiftAssignment.update({
      where: { id: assignmentId },
      data: { status: "COBERTO" }
    });

    // 3. Cria o WorkPeriod REAL para o Substituto
    await tx.workPeriod.create({
      data: {
        assignmentId,
        employeeId: substituteEmployeeId,
        type: "COBERTURA",
        actualStart: coverageStart,
        actualEnd: coverageEnd
      }
    });
  });

  revalidatePath("/escalas/ocorrencias");
}

export async function confirmNormalPresence(assignmentId: string, employeeId: string) {
  const assignment = await prisma.shiftAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error("Plantão não encontrado.");

  await prisma.$transaction(async (tx) => {
    await tx.workPeriod.create({
      data: {
        assignmentId,
        employeeId,
        type: "NORMAL",
        actualStart: assignment.plannedStart,
        actualEnd: assignment.plannedEnd
      }
    });

    await tx.shiftAssignment.update({
      where: { id: assignmentId },
      data: { status: "REALIZADO_INTEGRAL" }
    });
  });

  revalidatePath("/escalas/ocorrencias");
}

// Retorna funcionários ativos para o combo de substitutos
// Retorna funcionários ativos para o combo de substitutos, que NÃO estejam já escalados para o dia
export async function getActiveEmployeesForSubstitute(dateStr: string) {
  const startOfDay = new Date(`${dateStr}T00:00:00Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59Z`);

  return prisma.employee.findMany({
    where: { 
      status: "Ativo", 
      deleted: false,
      // Não pode ter plantão nesse mesmo dia
      assignments: {
        none: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      // E também não pode já estar cobrindo alguém nesse mesmo dia
      coveragesAsSubstitute: {
        none: {
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }
    },
    include: { user: true },
    orderBy: { firstName: 'asc' }
  });
}
