"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveEmployeeScheduleConfig(formData: FormData) {
  const employeeId = formData.get("employeeId") as string;
  const shiftPatternId = formData.get("shiftPatternId") as string;
  const defaultShiftIdStr = formData.get("defaultShiftId") as string;
  const cycleAnchorDateStr = formData.get("cycleAnchorDate") as string;
  const cycleAnchorPosition = parseInt(formData.get("cycleAnchorPosition") as string, 10);

  if (!employeeId || !shiftPatternId || !cycleAnchorDateStr || isNaN(cycleAnchorPosition)) {
    throw new Error("Preencha os campos obrigatórios corretamente.");
  }

  // Handle timezone manually or just convert date
  const anchorDate = new Date(`${cycleAnchorDateStr}T12:00:00Z`); // use noon UTC to avoid offset issues

  const data: any = {
    employeeId,
    shiftPatternId,
    cycleAnchorDate: anchorDate,
    cycleAnchorPosition
  };

  if (defaultShiftIdStr) {
    data.defaultShiftId = defaultShiftIdStr;
  } else {
    data.defaultShiftId = null; // optional
  }

  await prisma.employeeScheduleConfig.upsert({
    where: { employeeId },
    create: data,
    update: data
  });

  revalidatePath(`/funcionarios/${employeeId}`);
}
