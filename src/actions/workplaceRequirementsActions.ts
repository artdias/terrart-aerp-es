"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClientsWithWorkplaces() {
  return prisma.client.findMany({
    where: { deleted: false },
    orderBy: { companyName: 'asc' },
    include: {
      workplaces: {
        include: {
          shiftRequirements: true
        }
      }
    }
  });
}

export async function getWorkplaceWithRequirements(workplaceId: string) {
  return prisma.workplace.findUnique({
    where: { id: workplaceId },
    include: {
      client: true,
      shiftRequirements: {
        include: {
          shift: true
        }
      }
    }
  });
}

export async function addWorkplaceRequirement(formData: FormData) {
  const workplaceId = formData.get("workplaceId") as string;
  const shiftId = formData.get("shiftId") as string;
  const requiredEmployees = parseInt(formData.get("requiredEmployees") as string, 10);
  const daysOfWeekStr = formData.get("daysOfWeek") as string;

  if (!workplaceId || !shiftId || isNaN(requiredEmployees) || requiredEmployees < 1) {
    throw new Error("Preencha todos os campos corretamente.");
  }

  let daysOfWeek = [];
  try {
    if (daysOfWeekStr) {
      daysOfWeek = JSON.parse(daysOfWeekStr);
    }
  } catch (error) {
    daysOfWeek = []; // default fallback
  }

  // Verifica se já existe um requirement para esse posto + turno
  const existing = await prisma.workplaceRequirement.findFirst({
    where: { workplaceId, shiftId }
  });

  if (existing) {
    throw new Error("Este turno já está configurado para este posto. Edite-o ou exclua o existente.");
  }

  await prisma.workplaceRequirement.create({
    data: {
      workplaceId,
      shiftId,
      requiredEmployees,
      daysOfWeek
    }
  });

  revalidatePath(`/escalas/postos/${workplaceId}`);
}

export async function deleteWorkplaceRequirement(id: string, workplaceId: string) {
  await prisma.workplaceRequirement.delete({
    where: { id }
  });
  revalidatePath(`/escalas/postos/${workplaceId}`);
}
