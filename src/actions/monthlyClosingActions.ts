"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClosingData(month: string, workplaceId?: string) {
  // Recebe YYYY-MM
  if (!month) return [];

  // Busca todos os funcionários que tem alguma escala nesse mês
  const assignments = await prisma.shiftAssignment.findMany({
    where: { 
      competencyMonth: month,
      ...(workplaceId ? { workplaceId } : {})
    },
    include: {
      employee: { include: { user: true } },
      occurrences: true,
      coverages: true,
      workPeriods: true,
      shift: true
    }
  });

  // Agrupar por funcionário
  const empMap = new Map();

  for (const a of assignments) {
    const empId = a.employeeId;
    if (!empMap.has(empId)) {
      empMap.set(empId, {
        employee: a.employee,
        totalPlannedShifts: 0,
        totalCompletedShifts: 0,
        totalAbsences: 0,
        occurrences: [],
        coveragesAsSub: [] // plantões que este func fez cobrindo alguem
      });
    }

    const data = empMap.get(empId);
    data.totalPlannedShifts += 1;

    if (a.status === "REALIZADO_INTEGRAL") {
      data.totalCompletedShifts += 1;
    }
    
    if (a.status === "FALTA") {
      data.totalAbsences += 1;
    }

    if (a.occurrences.length > 0) {
      data.occurrences.push(...a.occurrences);
    }
  }

  // Buscar coberturas feitas no mês (para pagar hora extra/banco de horas)
  const coverages = await prisma.coverage.findMany({
    where: {
      assignment: { 
        competencyMonth: month,
        ...(workplaceId ? { workplaceId } : {})
      }
    },
    include: {
      assignment: { include: { shift: true } },
      financialAdjustments: true
    }
  });

  for (const c of coverages) {
    const subId = c.substituteEmployeeId;
    if (!empMap.has(subId)) continue; // Pode acontecer se o sub for de outro mês, mas improvável
    
    empMap.get(subId).coveragesAsSub.push(c);
  }

  return Array.from(empMap.values());
}

export async function processFinancialAdjustments(employeeId: string, month: string) {
  // Esse método pega as occurrences de Faltas/Atrasos e as Coverages (como substituto) 
  // do mês e as converte em FinancialAdjustment para envio para contabilidade.

  // 1. Ocorrências (Descontos)
  const occurrences = await prisma.occurrence.findMany({
    where: {
      employeeId,
      assignment: { competencyMonth: month },
      status: { not: "PROCESSADO" }
    },
    include: { assignment: { include: { shift: true } } }
  });

  for (const occ of occurrences) {
    if (occ.type === "FALTA_INTEGRAL" || occ.type === "ABANDONO") {
      // Calcular minutos do turno perdido
      const [sh, sm] = occ.assignment.shift.startTime.split(":").map(Number);
      const [eh, em] = occ.assignment.shift.endTime.split(":").map(Number);
      
      let minutes = (eh * 60 + em) - (sh * 60 + sm);
      if (minutes < 0) minutes += 24 * 60; // Cruzou a noite

      await prisma.financialAdjustment.create({
        data: {
          employeeId,
          occurrenceId: occ.id,
          type: "DESCONTO",
          minutesAmount: minutes,
          status: "EM_ANALISE"
        }
      });

      await prisma.occurrence.update({
        where: { id: occ.id },
        data: { status: "PROCESSADO" }
      });
    }
  }

  // 2. Coberturas (Ganhos / Hora Extra)
  const coverages = await prisma.coverage.findMany({
    where: {
      substituteEmployeeId: employeeId,
      assignment: { competencyMonth: month }
    },
    include: { financialAdjustments: true }
  });

  for (const cov of coverages) {
    if (cov.financialAdjustments.length > 0) continue; // Já processado

    const start = cov.startTime.getTime();
    const end = cov.endTime.getTime();
    const minutes = Math.floor((end - start) / 60000);

    await prisma.financialAdjustment.create({
      data: {
        employeeId,
        coverageId: cov.id,
        type: "PAGAMENTO_EXTRA",
        minutesAmount: minutes,
        status: "EM_ANALISE"
      }
    });
  }

  // 3. Marca o Fechamento
  await prisma.monthlyClosing.upsert({
    where: {
      employeeId_competencyMonth: { employeeId, competencyMonth: month }
    },
    create: {
      employeeId,
      competencyMonth: month,
      status: "FECHADO"
    },
    update: {
      status: "FECHADO"
    }
  });

  revalidatePath("/escalas/fechamento");
}
