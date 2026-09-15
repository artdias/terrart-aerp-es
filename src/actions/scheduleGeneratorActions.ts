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
  if (!schedule) throw new Error("Escala não encontrada.");

  // Se já houver Assignments para esse schedule, deletamos para recriar (pois é rascunho)
  if (schedule.status !== "GERADA" && schedule.status !== "EM_REVISAO" && schedule.status !== "PUBLICADA" && schedule.status !== "ENCERRADA") {
     await prisma.shiftAssignment.deleteMany({
       where: { scheduleId }
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
