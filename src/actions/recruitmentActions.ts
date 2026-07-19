"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";
import { logAction } from "@/lib/audit";

export async function createInterviewAction(formData: FormData) {
  const employeeId = sanitizeInput(formData.get("employeeId") as string);
  const interviewer = sanitizeInput(formData.get("interviewer") as string);
  const points = sanitizeInput(formData.get("points") as string);
  const summary = sanitizeInput(formData.get("summary") as string);
  const status = sanitizeInput(formData.get("status") as string); // Contrato, Em Análise, Negado
  const interviewDateStr = sanitizeInput(formData.get("interviewDate") as string);

  if (!employeeId || !interviewer || !points || !summary || !status) {
    throw new Error("Preencha todos os campos obrigatórios da entrevista.");
  }

  // Criar registro da entrevista
  const interviewDate = interviewDateStr ? new Date(interviewDateStr) : new Date();

  await prisma.interview.create({
    data: {
      employeeId,
      interviewer,
      points,
      summary,
      status,
      interviewDate
    }
  });

  // Atualizar status no perfil do funcionário
  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: { status }
  });

  const fullName = `${employee.firstName} ${employee.lastName || ""}`.trim();

  // Registrar na auditoria
  await logAction(
    "CREATE_INTERVIEW",
    `Entrevista registrada para '${fullName}' (ID: ${employeeId}). Status alterado para: '${status}'. Entrevistador: '${interviewer}'.`
  );

  revalidatePath(`/funcionarios/${employeeId}`);
  revalidatePath("/funcionarios");
}
