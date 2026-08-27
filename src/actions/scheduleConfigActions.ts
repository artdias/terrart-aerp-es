"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- SHIFTS ---
export async function getShifts() {
  return prisma.shift.findMany({
    orderBy: { startTime: 'asc' }
  });
}

export async function createShift(formData: FormData) {
  const name = formData.get("name") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const crossesMidnight = formData.get("crossesMidnight") === "true";

  if (!name || !startTime || !endTime) {
    throw new Error("Nome, hora de início e hora de fim são obrigatórios.");
  }

  await prisma.shift.create({
    data: {
      name,
      startTime,
      endTime,
      crossesMidnight
    }
  });

  revalidatePath("/escalas/configuracoes/turnos");
}

export async function deleteShift(id: string) {
  await prisma.shift.delete({
    where: { id }
  });
  revalidatePath("/escalas/configuracoes/turnos");
}

// --- SHIFT PATTERNS ---
export async function getShiftPatterns() {
  return prisma.shiftPattern.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createShiftPattern(formData: FormData) {
  const name = formData.get("name") as string;
  const cycleLength = parseInt(formData.get("cycleLength") as string, 10);
  const cycleConfigStr = formData.get("cycleConfig") as string;

  if (!name || isNaN(cycleLength) || !cycleConfigStr) {
    throw new Error("Campos inválidos para Padrão de Escala.");
  }

  let cycleConfig;
  try {
    cycleConfig = JSON.parse(cycleConfigStr);
  } catch (error) {
    throw new Error("Formato inválido para a configuração do ciclo.");
  }

  await prisma.shiftPattern.create({
    data: {
      name,
      cycleLength,
      cycleConfig
    }
  });

  revalidatePath("/escalas/configuracoes/ciclos");
}

export async function deleteShiftPattern(id: string) {
  await prisma.shiftPattern.delete({
    where: { id }
  });
  revalidatePath("/escalas/configuracoes/ciclos");
}
