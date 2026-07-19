import NovaCautelaForm from "./NovaCautelaForm";
import { prisma } from "@/lib/prisma";

export default async function NovaCautelaPage() {
  const funcionarios = await prisma.employee.findMany({
    where: { deleted: false },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const produtos = await prisma.product.findMany({
    where: { deleted: false,  quantity: { gt: 0 } },
    orderBy: { name: 'asc' }
  });

  return <NovaCautelaForm funcionarios={funcionarios} produtos={produtos} />;
}
