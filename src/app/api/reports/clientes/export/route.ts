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

  try {
    const clients = await prisma.client.findMany({
      where: {
        deleted: false,
        OR: [
          { companyName: { contains: search } },
          { cnpj: { contains: search } },
          { name: { contains: search } }
        ]
      },
      orderBy: { companyName: "asc" }
    });

    let csvContent = "\uFEFF"; // BOM para abrir acentos corretos no Excel
    csvContent += "ID,Razão Social,CNPJ,Nome Fantasia,Endereço,Cidade,Estado,CEP,E-mail,Telefone,Representante Legal,Contato Representante,Data de Cadastro\r\n";

    for (const c of clients) {
      const dateFormatted = new Date(c.createdAt).toLocaleDateString("pt-BR");
      
      const companyNameClean = (c.companyName || "").replace(/"/g, '""');
      const cnpjClean = (c.cnpj || "").replace(/"/g, '""');
      const nameClean = (c.name || "").replace(/"/g, '""');
      const addressClean = (c.address || "").replace(/"/g, '""');
      const cityClean = (c.city || "").replace(/"/g, '""');
      const stateClean = (c.state || "").replace(/"/g, '""');
      const cepClean = (c.cep || "").replace(/"/g, '""');
      const emailClean = (c.email || "").replace(/"/g, '""');
      const phoneClean = (c.phone || c.cellphone || "").replace(/"/g, '""');
      const managerClean = (c.managerName || "").replace(/"/g, '""');
      const managerContactClean = (c.managerContact || "").replace(/"/g, '""');

      csvContent += `"${c.id}","${companyNameClean}","${cnpjClean}","${nameClean}","${addressClean}","${cityClean}","${stateClean}","${cepClean}","${emailClean}","${phoneClean}","${managerClean}","${managerContactClean}","${dateFormatted}"\r\n`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=relatorio_clientes.csv"
      }
    });
  } catch (err) {
    return new NextResponse("Erro ao exportar dados.", { status: 500 });
  }
}
