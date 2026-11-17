import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatWhatsAppUrl } from "@/components/WhatsAppButton";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const statusParam = req.nextUrl.searchParams.get("status") || "";
  const roleParam = req.nextUrl.searchParams.get("role") || "";
  const clientIdParam = req.nextUrl.searchParams.get("clientId") || "";
  const fieldsParam = req.nextUrl.searchParams.get("fields") || "completo";

  try {
    const andConditions: any[] = [{ deleted: false }];

    if (statusParam) {
      andConditions.push({ status: statusParam });
    }

    if (roleParam) {
      andConditions.push({
        roleTitle: { contains: roleParam, mode: "insensitive" },
      });
    }

    if (clientIdParam) {
      andConditions.push({
        workplace: { clientId: clientIdParam },
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { cpf: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { roleTitle: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const employees = await prisma.employee.findMany({
      where: { AND: andConditions },
      include: { user: true, workplace: { include: { client: true } } },
      orderBy: { firstName: "asc" },
    });

    let csvContent = "\uFEFF"; // BOM para Excel

    if (fieldsParam === "contatos") {
      csvContent +=
        "Nome Completo,Categoria / Cargo,Telefone / WhatsApp,Link Direto WhatsApp,Status Contratual,Posto / Cliente\r\n";

      for (const e of employees) {
        const rawName =
          e.user?.name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || "Sem Nome";
        const fullName = rawName.replace(/"/g, '""');
        const role = (e.roleTitle || "").replace(/"/g, '""');
        const phone = (e.phone || "").replace(/"/g, '""');
        const waUrl = (formatWhatsAppUrl(e.phone) || "").replace(/"/g, '""');
        const status = (e.status || "").replace(/"/g, '""');
        const workplaceClient = e.workplace
          ? `${e.workplace.name} (${e.workplace.client?.companyName || ""})`
          : "Não alocado";
        const workplaceClean = workplaceClient.replace(/"/g, '""');

        csvContent += `"${fullName}","${role}","${phone}","${waUrl}","${status}","${workplaceClean}"\r\n`;
      }
    } else {
      csvContent +=
        "ID,Nome Completo,Telefone Celular,Link WhatsApp,Cargo / Categoria,E-mail,CPF,RG,CNH,Salário (R$),Chave PIX,Posto de Trabalho,Cliente Alocado,Status Contratual,Data de Cadastro\r\n";

      for (const e of employees) {
        const dateFormatted = new Date(e.createdAt).toLocaleDateString("pt-BR");
        const rawName =
          e.user?.name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || "Sem Nome";
        const fullName = rawName.replace(/"/g, '""');
        const email = (e.user?.email || "").replace(/"/g, '""');
        const phone = (e.phone || "").replace(/"/g, '""');
        const waUrl = (formatWhatsAppUrl(e.phone) || "").replace(/"/g, '""');
        const cpf = (e.cpf || "").replace(/"/g, '""');
        const rg = (e.rg || "").replace(/"/g, '""');
        const cnh = (e.cnh || "").replace(/"/g, '""');
        const role = (e.roleTitle || "").replace(/"/g, '""');
        const salary = e.salary ? e.salary.toFixed(2) : "0.00";
        const pixKey = (e.pixKey || "").replace(/"/g, '""');
        const workplaceName = (e.workplace?.name || "").replace(/"/g, '""');
        const clientName = (e.workplace?.client?.companyName || "").replace(/"/g, '""');
        const status = (e.status || "").replace(/"/g, '""');

        csvContent += `"${e.id}","${fullName}","${phone}","${waUrl}","${role}","${email}","${cpf}","${rg}","${cnh}","${salary}","${pixKey}","${workplaceName}","${clientName}","${status}","${dateFormatted}"\r\n`;
      }
    }

    const fileSuffix = roleParam
      ? `_${roleParam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
      : "";
    const modeSuffix = fieldsParam === "contatos" ? "_nome_telefone" : "";

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=relatorio_funcionarios${fileSuffix}${modeSuffix}.csv`,
      },
    });
  } catch (err) {
    return new NextResponse("Erro ao exportar dados.", { status: 500 });
  }
}
