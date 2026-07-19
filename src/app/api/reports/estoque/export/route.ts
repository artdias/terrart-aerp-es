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
  const categoryParam = req.nextUrl.searchParams.get("category") || "";

  try {
    const products = await prisma.product.findMany({
      where: {
        deleted: false,
        category: categoryParam ? categoryParam : undefined,
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } }
        ]
      },
      orderBy: { name: "asc" }
    });

    let csvContent = "\uFEFF"; // BOM
    csvContent += "ID,Produto,Categoria,Tamanho,Modelo/Gênero,SKU,Qtd Central,Qtd Mínima Alerta,Unidade Medida,Preço Unitário (R$)\r\n";

    for (const p of products) {
      const name = (p.name || "").replace(/"/g, '""');
      const category = (p.category || "").replace(/"/g, '""');
      const size = (p.size || "").replace(/"/g, '""');
      const model = (p.modelType || "").replace(/"/g, '""');
      const sku = (p.sku || "").replace(/"/g, '""');
      const quantity = p.quantity;
      const minQuantity = p.minQuantity;
      const unit = (p.unit || "un").replace(/"/g, '""');
      const price = p.price ? p.price.toFixed(2) : "0.00";

      csvContent += `"${p.id}","${name}","${category}","${size}","${model}","${sku}","${quantity}","${minQuantity}","${unit}","${price}"\r\n`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=relatorio_estoque.csv"
      }
    });
  } catch (err) {
    return new NextResponse("Erro ao exportar dados.", { status: 500 });
  }
}
