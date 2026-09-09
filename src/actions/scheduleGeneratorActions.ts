"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSchedules() {
  return prisma.schedule.findMany({
    include: { workplace: { include: { client: true } } },
    orderBy: { competencyMonth: 'desc' }
  });
}

export async function createSchedule(formData: FormData) {
  const competencyMonth = formData.get("competencyMonth") as string;
  const workplaceId = formData.get("workplaceId") as string;
  const name = formData.get("name") as string;

  if (!competencyMonth) throw new Error("Mês de competência é obrigatório.");
  if (!workplaceId) throw new Error("Posto/Empresa é obrigatório.");

  const existing = await prisma.schedule.findFirst({
    where: { competencyMonth, workplaceId }
  });

  if (existing) {
    throw new Error("Já existe uma escala para este mês nesta Empresa.");
  }

  const schedule = await prisma.schedule.create({
    data: {
      competencyMonth,
      workplaceId,
      name: name || `Escala ${competencyMonth}`,
      status: "RASCUNHO" // Will be updated to GERADA in generateScheduleDraft
    }
  });

  await generateScheduleDraft(schedule.id);

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
  if (!schedule) throw new Error("Escala nÃ£o encontrada.");

  // Se jÃ¡ houver Assignments para esse schedule, deletamos para recriar (pois Ã© rascunho)
  if (schedule.status === "GERADA" || schedule.status === "EM_REVISAO" || schedule.status === "PUBLICADA" || schedule.status === "ENCERRADA") {
     // Apenas recriamos se estiver em rascunho
  } else {
     await prisma.shiftAssignment.deleteMany({
       where: { scheduleId }
     });
  }

  // 1. Definir o primeiro e Ãºltimo dia do mÃªs
  const [year, month] = schedule.competencyMonth.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)); // meio dia UTC para evitar bugs de fuso
  const endDate = new Date(Date.UTC(year, month, 0, 12, 0, 0));

  // 2. Buscar funcionÃ¡rios configurados para este posto (ou todos se global)
  const employees = await prisma.employee.findMany({
    where: {
      status: "Ativo",
      deleted: false,
      workplaceId: schedule.workplaceId ? schedule.workplaceId : { not: null },
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

  // 3. Iterar por cada dia do mÃªs
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentMs = d.getTime();

    // 4. Iterar por cada funcionÃ¡rio
    for (const emp of employees) {
      const config = emp.scheduleConfig!;
      const pattern = config.shiftPattern;
      const cycleLen = pattern.cycleLength;
      const cycleArray = pattern.cycleConfig as any[];
      
      const anchorDate = new Date(config.cycleAnchorDate);
      anchorDate.setUTCHours(12, 0, 0, 0); // padronizar
      
      // DiferenÃ§a em dias
      const diffTime = currentMs - anchorDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Calcular a posiÃ§Ã£o atual no ciclo
      // MatemÃ¡gica: ((diffDays % cycleLen) + cycleLen) % cycleLen + cycleAnchorPosition
      let rawPos = (diffDays % cycleLen);
      if (rawPos < 0) rawPos += cycleLen; 
      
      const currentPos = (rawPos + config.cycleAnchorPosition) % cycleLen;
      const todayConfig = cycleArray[currentPos];

      if (todayConfig && todayConfig.type === "WORK") {
        // Encontrar qual turno ele vai fazer
        let shiftId = config.defaultShiftId;
        
        // Se nÃ£o tiver turno padrÃ£o no perfil, pega a primeira demanda do posto
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
    // Prisma nÃ£o aceita string num Enum default de createMany as vezes, precisa castar, mas como ta no schema string, vai rodar.
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

export async function closeSchedule(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Escala não encontrada.");
  await prisma.schedule.update({ where: { id: scheduleId }, data: { status: "ENCERRADA" } });
  revalidatePath("/escalas/planejamento");
  return schedule;
}

export async function reopenSchedule(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error("Escala n�o encontrada.");
  await prisma.schedule.update({ where: { id: scheduleId }, data: { status: "EM_REVISAO" } });
  revalidatePath("/escalas/planejamento");
  return schedule;
}

export async function updateScheduleNotes(scheduleId: string, closingNotes: string) {
  await prisma.schedule.update({ where: { id: scheduleId }, data: { closingNotes } });
  revalidatePath("/escalas/fechamento");
}
