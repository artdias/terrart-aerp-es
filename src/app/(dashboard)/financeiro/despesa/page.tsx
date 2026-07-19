import { prisma } from "@/lib/prisma";
import NovaDespesaForm from "./NovaDespesaForm";

export default async function NovaDespesaPage() {
  // Busca todos os produtos do estoque central para exibição na integração
  const produtos = await prisma.product.findMany({ where: { deleted: false }, 
    orderBy: { name: 'asc' },
    select: { id: true, name: true, unit: true, category: true }
  });

  return <NovaDespesaForm produtos={produtos} />;
}
