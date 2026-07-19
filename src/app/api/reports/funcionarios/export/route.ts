import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const statusParam = req.nextUrl.searchParams.get("status") || "";

  try {
    const employees = await prisma.employee.findMany({
      where: {
        deleted: false,
        status: statusParam ? statusParam : undefined,
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { cpf: { contains: search } }
        ]
      },
      include: { user: true, workplace: { include: { client: true } } },
      orderBy: { firstName: "asc" }
    });

    let csvContent = "\uFEFF"; // BOM
    csvContent += "ID,Nome Completo,E-mail,CPF,RG,CNH,Cargo / Função,Salário (R$),Posto de Trabalho,Cliente Alocado,Status Contratual,Data de Cadastro\r\n";

    for (const e of employees) {
      const dateFormatted = new Date(e.createdAt).toLocaleDateString("pt-BR");
      const fullName = `${e.firstName} ${e.lastName || ""}`.trim().replace(/"/g, '""');
      const email = (e.user?.email || "").replace(/"/g, '""');
      const cpf = (e.cpf || "").replace(/"/g, '""');
      const rg = (e.rg || "").replace(/"/g, '""');
      const cnh = (e.cnh || "").replace(/"/g, '""');
      const role = (e.roleTitle || "").replace(/"/g, '""');
      const salary = e.salary ? e.salary.toFixed(2) : "0.00";
      const workplaceName = (e.workplace?.name || "").replace(/"/g, '""');
      const clientName = (e.workplace?.client?.companyName || "").replace(/"/g, '""');
      const status = (e.status || "").replace(/"/g, '""');

      csvContent += `"${e.id}","${fullName}","${email}","${cpf}","${rg}","${cnh}","${role}","${salary}","${workplaceName}","${clientName}","${status}","${dateFormatted}"\r\n`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=relatorio_funcionarios.csv"
      }
    });
  } catch (err) {
    return new NextResponse("Erro ao exportar dados.", { status: 500 });
  }
}
