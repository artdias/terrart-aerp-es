import NovaEscalaForm from "./NovaEscalaForm";
import { prisma } from "@/lib/prisma";

export default async function NovaEscalaPage() {
  const funcionarios = await prisma.employee.findMany({
    where: { deleted: false },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  return <NovaEscalaForm funcionarios={funcionarios} clientes={clientes} />;
}
