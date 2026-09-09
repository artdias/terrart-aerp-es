"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPayrollData(month: string, workplaceId?: string) {
  if (!month) return [];

  // Busca todos os funcionrios que tem alguma escala (ShiftAssignment) FECHADA nesse ms
  // Na verdade, s filtramos as escalas ENCERRADAS para no pagar antes de fechar a escala
  const assignments = await prisma.shiftAssignment.findMany({
    where: { 
      competencyMonth: month,
      schedule: { status: "ENCERRADA" },
      ...(workplaceId ? { workplaceId } : {})
    },
    include: {
      employee: { include: { user: true } },
      occurrences: true,
      coverages: true,
      workPeriods: true,
      shift: true,
      workplace: true
    }
  });

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
        coveragesAsSub: [],
        workplaces: new Set()
      });
    }

    const data = empMap.get(empId);
    data.totalPlannedShifts += 1;
    data.workplaces.add(a.workplace?.name || "Global");

    if (a.status === "REALIZADO_INTEGRAL") {
      data.totalCompletedShifts += 1;
    }
    
    if (a.status === "FALTA") {
      data.totalAbsences += 1;
    }

    if (a.occurrences.length > 0) {
      data.occurrences.push(...a.occurrences.map((o: any) => ({ ...o, assignment: a })));
    }
  }

  // Buscar coberturas feitas como substituto no ms
  const coverages = await prisma.coverage.findMany({
    where: {
      assignment: { 
        competencyMonth: month,
        schedule: { status: "ENCERRADA" },
        ...(workplaceId ? { workplaceId } : {})
      }
    },
    include: {
      assignment: { include: { shift: true } }
    }
  });

  for (const c of coverages) {
    const subId = c.substituteEmployeeId;
    // Se o substituto no tiver assignment prprio, a gente adiciona ele
    if (!empMap.has(subId)) {
      const emp = await prisma.employee.findUnique({ where: { id: subId }, include: { user: true } });
      if (emp) {
        empMap.set(subId, {
          employee: emp,
          totalPlannedShifts: 0,
          totalCompletedShifts: 0,
          totalAbsences: 0,
          occurrences: [],
          coveragesAsSub: [],
          workplaces: new Set()
        });
      }
    }
    if (empMap.has(subId)) {
      empMap.get(subId).coveragesAsSub.push(c);
    }
  }

  // Buscar status de fechamento
  const results = Array.from(empMap.values());
  for (const data of results) {
    const closing = await prisma.monthlyClosing.findUnique({
      where: {
        employeeId_competencyMonth: { employeeId: data.employee.id, competencyMonth: month }
      }
    });
    data.isPaid = closing?.status === "FECHADO";
    data.workplaceNames = Array.from(data.workplaces).join(", ");
  }

  return results;
}

export async function registerPayrollPayment(employeeId: string, month: string, amount: number, empName: string) {
  // 1. Marca MonthlyClosing como FECHADO
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

  // 2. Cria a despesa
  await prisma.expense.create({
    data: {
      description: `Pagamento de Folha (${month}) - ${empName}`,
      amount: amount,
      dueDate: new Date(), // Pago na hora
      status: "PAID",
      category: "Folha de Pagamento"
    }
  });

  revalidatePath("/financeiro/folha-pagamento");
}