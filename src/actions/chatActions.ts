"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeInput } from "@/lib/sanitize";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function sendMessageAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const senderId = (session?.user as any)?.id;

  if (!senderId) {
    throw new Error("Usuário não autenticado.");
  }

  const receiverId = sanitizeInput(formData.get("receiverId") as string);
  const content = sanitizeInput(formData.get("content") as string);

  if (!receiverId || !content) {
    throw new Error("Destinatário e conteúdo são obrigatórios.");
  }

  const msg = await prisma.chatMessage.create({
    data: {
      senderId,
      receiverId,
      content,
      read: false
    }
  });

  revalidatePath("/chat");
  return msg;
}

export async function deleteMessageAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const loggedUserId = (session?.user as any)?.id;

  if (!loggedUserId) {
    throw new Error("Usuário não autenticado.");
  }

  const messageId = sanitizeInput(formData.get("messageId") as string);

  if (!messageId) {
    throw new Error("ID da mensagem inválido.");
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId }
  });

  if (!message) {
    throw new Error("Mensagem não encontrada.");
  }

  // Apenas o remetente pode apagar a mensagem
  if (message.senderId !== loggedUserId) {
    throw new Error("Você não tem permissão para apagar esta mensagem.");
  }

  await logAction("DELETE_CHAT_MESSAGE", `Apagou a mensagem de chat (ID: ${messageId}) enviada para o usuário/grupo de ID '${message.receiverId}'. Conteúdo apagado: "${message.content}".`);

  await prisma.chatMessage.delete({
    where: { id: messageId }
  });

  revalidatePath("/chat");
}
