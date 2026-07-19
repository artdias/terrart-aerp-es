import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatContainer from "./ChatContainer";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const loggedUserId = (session.user as any).id;

  // Buscar todos os usuários do sistema, exceto o próprio usuário logado e o usuário geral
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [loggedUserId, "geral"] }
    },
    orderBy: {
      name: "asc"
    }
  });

  // Para cada usuário, contar a quantidade de mensagens não lidas enviadas por ele
  const usersWithUnread = await Promise.all(
    users.map(async (u) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderId: u.id,
          receiverId: loggedUserId,
          read: false
        }
      });
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        unreadCount
      };
    })
  );

  const finalUsersList = [
    {
      id: "geral",
      name: "Chat Geral (Grupo)",
      email: "geral@aerp.com",
      role: "Mural da Empresa",
      unreadCount: 0
    },
    ...usersWithUnread
  ];

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <ChatContainer initialUsers={finalUsersList} loggedUserId={loggedUserId} />
    </div>
  );
}
