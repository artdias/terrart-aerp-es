import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const loggedUserEmail = session?.user?.email;

  // Apenas o administrador master (admin) pode exportar os logs
  if (loggedUserEmail !== "admin") {
    return new NextResponse("Não autorizado.", { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const statusParam = req.nextUrl.searchParams.get("status") || ""; // Representa a ação no painel

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: statusParam ? statusParam : undefined,
        OR: [
          { userName: { contains: search } },
          { details: { contains: search } }
        ]
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Construção do arquivo CSV em formato UTF-8 com BOM (para abrir acentos corretamente no Excel)
    let csvContent = "\uFEFF"; // Byte Order Mark (BOM)
    csvContent += "ID,Data e Hora,Usuário,Ação Executada,Detalhes\r\n";

    for (const log of logs) {
      const dateFormatted = new Date(log.createdAt).toLocaleString("pt-BR");
      const userClean = log.userName.replace(/"/g, '""');
      const actionClean = log.action.replace(/"/g, '""');
      const detailsClean = log.details.replace(/"/g, '""');

      csvContent += `"${log.id}","${dateFormatted}","${userClean}","${actionClean}","${detailsClean}"\r\n`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=auditoria_sistema.csv"
      }
    });
  } catch (err) {
    return new NextResponse("Erro ao exportar relatório.", { status: 500 });
  }
}
