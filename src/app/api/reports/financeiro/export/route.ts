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
  const typeParam = req.nextUrl.searchParams.get("type") || "";

  try {
    // 1. Buscar receitas (Invoices)
    const invoices = await prisma.invoice.findMany({
      where: {
        status: statusParam ? statusParam : undefined,
        OR: [
          { description: { contains: search } },
          { client: { companyName: { contains: search } } }
        ]
      },
      include: { client: true }
    });

    // 2. Buscar despesas (Expenses)
    const expenses = await prisma.expense.findMany({
      where: {
        status: statusParam ? statusParam : undefined,
        description: { contains: search }
      }
    });

    // 3. Mesclar dados em uma única listagem de fluxo de caixa
    let cashFlow: any[] = [];

    for (const inv of invoices) {
      cashFlow.push({
        id: inv.id,
        type: "RECEITA",
        description: `Faturamento - Cliente: ${inv.client.companyName}${inv.description ? ` (${inv.description})` : ""}`,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status
      });
    }

    for (const exp of expenses) {
      cashFlow.push({
        id: exp.id,
        type: "DESPESA",
        description: `Conta: ${exp.description} [${exp.category}]`,
        amount: exp.amount,
        dueDate: exp.dueDate,
        status: exp.status
      });
    }

    if (typeParam) {
      cashFlow = cashFlow.filter((item) => item.type === typeParam);
    }

    // Ordenar por data de vencimento decrescente
    cashFlow.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

    let csvContent = "\uFEFF"; // BOM
    csvContent += "ID Registro,Tipo Movimentação,Descrição do Lançamento,Valor (R$),Vencimento,Status\r\n";

    for (const item of cashFlow) {
      const typeClean = item.type;
      const descClean = item.description.replace(/"/g, '""');
      const amountClean = item.amount.toFixed(2);
      const dateFormatted = new Date(item.dueDate).toLocaleDateString("pt-BR");
      const statusClean = item.status;

      csvContent += `"${item.id}","${typeClean}","${descClean}","${amountClean}","${dateFormatted}","${statusClean}"\r\n`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=relatorio_financeiro.csv"
      }
    });
  } catch (err) {
    return new NextResponse("Erro ao exportar dados.", { status: 500 });
  }
}
