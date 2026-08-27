"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSchedules() {
  return prisma.schedule.findMany({
    orderBy: { competencyMonth: 'desc' }
  });
}

export async function createSchedule(formData: FormData) {
  const competencyMonth = formData.get("competencyMonth") as string;
  const name = formData.get("name") as string;

  if (!competencyMonth) throw new Error("Mês de competência é obrigatório.");

  const existing = await prisma.schedule.findFirst({
    where: { competencyMonth }
  });

  if (existing) {
    throw new Error("Já existe uma escala para este mês. Você pode editá-la.");
  }

  const schedule = await prisma.schedule.create({
    data: {
      competencyMonth,
      name: name || `Escala ${competencyMonth}`,
      status: "RASCUNHO"
    }
  });

  revalidatePath("/escalas/planejamento");
  return schedule;
}

export async function deleteSchedule(id: string) {
  await prisma.schedule.delete({ where: { id } });
  revalidatePath("/escalas/planejamento");
}

/**
 * MOTOR GERADOR DE ESCALAS (ALGORITMO PRINCIPAL)
 */
export async function generateScheduleDraft(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Escala não encontrada.");

  // Se já houver Assignments para esse schedule, deletamos para recriar (pois é rascunho)
  if (schedule.status === "GERADA" || schedule.status === "EM_REVISAO" || schedule.status === "PUBLICADA" || schedule.status === "ENCERRADA") {
     // Apenas recriamos se estiver em rascunho
  } else {
     await prisma.shiftAssignment.deleteMany({
       where: { scheduleId }
     });
  }

  // 1. Definir o primeiro e último dia do mês
  const [year, month] = schedule.competencyMonth.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)); // meio dia UTC para evitar bugs de fuso
  const endDate = new Date(Date.UTC(year, month, 0, 12, 0, 0));

  // 2. Buscar funcionários configurados
  const employees = await prisma.employee.findMany({
    where: {
      status: "Ativo",
      deleted: false,
      workplaceId: { not: null },
      scheduleConfig: { isNot: null }
    },
    include: {
      scheduleConfig: {
        include: {
          shiftPattern: true,
          defaultShift: true
        }
      },
      workplace: {
        include: { shiftRequirements: true }
      }
    }
  });

  const shifts = await prisma.shift.findMany();
  const shiftMap = new Map(shifts.map(s => [s.id, s]));

  const newAssignments = [];

  // 3. Iterar por cada dia do mês
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentMs = d.getTime();

    // 4. Iterar por cada funcionário
    for (const emp of employees) {
      const config = emp.scheduleConfig!;
      const pattern = config.shiftPattern;
      const cycleLen = pattern.cycleLength;
      const cycleArray = pattern.cycleConfig as any[];
      
      const anchorDate = new Date(config.cycleAnchorDate);
      anchorDate.setUTCHours(12, 0, 0, 0); // padronizar
      
      // Diferença em dias
      const diffTime = currentMs - anchorDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Calcular a posição atual no ciclo
      // Matemágica: ((diffDays % cycleLen) + cycleLen) % cycleLen + cycleAnchorPosition
      let rawPos = (diffDays % cycleLen);
      if (rawPos < 0) rawPos += cycleLen; 
      
      const currentPos = (rawPos + config.cycleAnchorPosition) % cycleLen;
      const todayConfig = cycleArray[currentPos];

      if (todayConfig && todayConfig.type === "WORK") {
        // Encontrar qual turno ele vai fazer
        let shiftId = config.defaultShiftId;
        
        // Se não tiver turno padrão no perfil, pega a primeira demanda do posto
        if (!shiftId && emp.workplace?.shiftRequirements.length) {
          shiftId = emp.workplace.shiftRequirements[0].shiftId;
        }

        if (shiftId) {
          const shift = shiftMap.get(shiftId);
          if (shift) {
            // Criar datas reais
            const pStart = new Date(d);
            const [sh, sm] = shift.startTime.split(":").map(Number);
            pStart.setUTCHours(sh + 3, sm, 0, 0); // Ajuste UTC-3 basico (Brasil)

            const pEnd = new Date(d);
            const [eh, em] = shift.endTime.split(":").map(Number);
            pEnd.setUTCHours(eh + 3, em, 0, 0);
            
            if (shift.crossesMidnight) {
              pEnd.setDate(pEnd.getDate() + 1);
            }

            newAssignments.push({
              scheduleId: schedule.id,
              employeeId: emp.id,
              workplaceId: emp.workplaceId!,
              shiftId: shift.id,
              date: new Date(d),
              plannedStart: pStart,
              plannedEnd: pEnd,
              competencyMonth: schedule.competencyMonth,
              status: "PLANEJADO" // usando o enum
            });
          }
        }
      }
    }
  }

  // Insert no banco
  if (newAssignments.length > 0) {
    // Prisma não aceita string num Enum default de createMany as vezes, precisa castar, mas como ta no schema string, vai rodar.
    await prisma.shiftAssignment.createMany({
      data: newAssignments as any
    });
  }
  
  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { status: "GERADA" }
  });

  revalidatePath("/escalas/planejamento");
}
