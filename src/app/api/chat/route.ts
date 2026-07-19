import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Garante a existência do usuário especial do grupo geral
async function ensureGeralUserExists() {
  const geral = await prisma.user.findUnique({ where: { id: "geral" } });
  if (!geral) {
    try {
      await prisma.user.create({
        data: {
          id: "geral",
          email: "geral@aerp.com",
          name: "Chat Geral (Grupo)",
          password: "group_chat_placeholder_hash",
          role: "GRUPO",
          allowClientes: true,
          allowFuncionarios: true,
          allowEscalas: true,
          allowEstoque: true,
          allowCautelas: true,
          allowFinanceiro: true,
          allowJuridico: true,
          allowFaturamento: true,
          allowRecepcao: true
        }
      });
    } catch (err) {
      // ignore
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const loggedUserId = (session?.user as any)?.id;

  if (!loggedUserId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await ensureGeralUserExists();

  const { searchParams } = new URL(req.url);
  const receiverId = searchParams.get("receiverId");

  if (!receiverId) {
    // Buscar todos os contatos exceto o usuário logado e o usuário geral
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: [loggedUserId, "geral"] }
      },
      orderBy: { name: "asc" }
    });

    const usersWithUnread = await Promise.all(
      users.map(async (u) => {
        const unreadCount = await prisma.chatMessage.count({
          where: { senderId: u.id, receiverId: loggedUserId, read: false }
        });
        return { id: u.id, name: u.name, email: u.email, role: u.role, unreadCount };
      })
    );

    // Preponderar o Chat Geral (Grupo) no início da lista
    const finalUsers = [
      {
        id: "geral",
        name: "Chat Geral (Grupo)",
        email: "geral@aerp.com",
        role: "Mural da Empresa",
        unreadCount: 0
      },
      ...usersWithUnread
    ];

    return NextResponse.json({ users: finalUsers });
  }

  // Se for chat individual, marcar mensagens como lidas
  if (receiverId !== "geral") {
    await prisma.chatMessage.updateMany({
      where: {
        senderId: receiverId,
        receiverId: loggedUserId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  // Buscar histórico de mensagens
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: receiverId === "geral" 
        ? [ { receiverId: "geral" } ]
        : [
            { senderId: loggedUserId, receiverId: receiverId },
            { senderId: receiverId, receiverId: loggedUserId }
          ]
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const loggedUserId = (session?.user as any)?.id;

  if (!loggedUserId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { receiverId, content } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Destinatário e conteúdo são obrigatórios." }, { status: 400 });
    }

    const msg = await prisma.chatMessage.create({
      data: {
        senderId: loggedUserId,
        receiverId,
        content,
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ message: msg });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
