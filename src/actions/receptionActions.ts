"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createScheduleEvent(formData: FormData) {
  const session = await getServerSession(authOptions);
  const creatorId = (session?.user as any)?.id;

  if (!creatorId) {
    throw new Error("Usuário não autenticado. Faça login para agendar.");
  }

  const title = sanitizeInput(formData.get("title") as string);
  const startAtStr = formData.get("startAt") as string;
  const endAtStr = formData.get("endAt") as string;
  const participantIds = formData.getAll("participantIds") as string[];
  const clientId = formData.get("clientId") as string || null;
  const employeeId = formData.get("employeeId") as string || null;
  const privacy = sanitizeInput(formData.get("privacy") as string) || "PUBLICO";

  if (!title || !startAtStr || !endAtStr || participantIds.length === 0) {
    throw new Error("Título, Data de Início, Data de Término e ao menos um Participante são obrigatórios.");
  }

  const startAt = new Date(startAtStr);
  const endAt = new Date(endAtStr);

  if (endAt <= startAt) {
    throw new Error("A data de término deve ser posterior à data de início.");
  }

  await prisma.scheduleEvent.create({
    data: {
      title,
      startAt,
      endAt,
      privacy,
      creatorId,
      participants: {
        connect: participantIds.map((id) => ({ id }))
      },
      clientId: clientId || null,
      employeeId: employeeId || null,
      status: "PENDENTE"
    }
  });

  revalidatePath("/recepcao");
  redirect("/recepcao");
}

export async function updateEventStatus(formData: FormData) {
  const eventId = sanitizeInput(formData.get("eventId") as string);
  const status = sanitizeInput(formData.get("status") as string);

  if (!eventId || !status) {
    throw new Error("ID do agendamento e status são obrigatórios.");
  }

  await prisma.scheduleEvent.update({
    where: { id: eventId },
    data: { status }
  });

  revalidatePath("/recepcao");
}

export async function createPhoneMessage(formData: FormData) {
  const recipientUserId = sanitizeInput(formData.get("recipientUserId") as string);
  const recipientNameStr = sanitizeInput(formData.get("recipientName") as string);
  
  const senderName = sanitizeInput(formData.get("senderName") as string);
  const senderContact = sanitizeInput(formData.get("senderContact") as string);
  const message = sanitizeInput(formData.get("message") as string);

  if (!recipientUserId && !recipientNameStr) {
    throw new Error("Destinatário é obrigatório.");
  }
  if (!senderName || !message) {
    throw new Error("Remetente e Mensagem são obrigatórios.");
  }

  // Se escolheu um usuário, pegar o nome dele como fallback
  let finalRecipientName = recipientNameStr || "Desconhecido";
  if (recipientUserId && recipientUserId !== "OUTRO") {
    const user = await prisma.user.findUnique({ where: { id: recipientUserId } });
    if (user) finalRecipientName = user.name;
  }

  await prisma.phoneMessage.create({
    data: {
      recipientUserId: recipientUserId !== "OUTRO" ? recipientUserId : null,
      recipientName: finalRecipientName,
      senderName,
      senderContact,
      message,
      status: "PENDENTE"
    }
  });

  revalidatePath("/recepcao");
  redirect("/recepcao");
}

export async function resolvePhoneMessage(formData: FormData) {
  const messageId = sanitizeInput(formData.get("messageId") as string);

  if (!messageId) {
    throw new Error("ID do recado inválido.");
  }

  await prisma.phoneMessage.update({
    where: { id: messageId },
    data: { status: "RESOLVIDO" }
  });

  revalidatePath("/recepcao");
  revalidatePath("/");
}

export async function createCalendarEvent(formData: FormData) {
  const session = await getServerSession(authOptions);
  const creatorId = (session?.user as any)?.id;

  if (!creatorId) {
    throw new Error("Usuário não autenticado. Faça login para agendar.");
  }

  const title = sanitizeInput(formData.get("title") as string);
  const startAtStr = formData.get("startAt") as string;
  const endAtStr = formData.get("endAt") as string;
  const participantIds = formData.getAll("participantIds") as string[];
  const clientId = formData.get("clientId") as string || null;
  const employeeId = formData.get("employeeId") as string || null;
  const privacy = sanitizeInput(formData.get("privacy") as string) || "PUBLICO";

  if (!title || !startAtStr || !endAtStr || participantIds.length === 0) {
    throw new Error("Título, Data de Início, Data de Término e ao menos um Participante são obrigatórios.");
  }

  const startAt = new Date(startAtStr);
  const endAt = new Date(endAtStr);

  if (endAt <= startAt) {
    throw new Error("A data de término deve ser posterior à data de início.");
  }

  await prisma.scheduleEvent.create({
    data: {
      title,
      startAt,
      endAt,
      privacy,
      creatorId,
      participants: {
        connect: participantIds.map((id) => ({ id }))
      },
      clientId: clientId || null,
      employeeId: employeeId || null,
      status: "PENDENTE"
    }
  });

  revalidatePath("/");
  redirect("/");
}
