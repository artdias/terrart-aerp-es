import EditFuncionarioForm from "./EditFuncionarioForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditarFuncionarioPage({ params }: { params: { id: string } }) {
  const func = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      workplace: true,
    }
  });

  if (!func) {
    return notFound();
  }

  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' },
    select: { id: true, companyName: true }
  });

  return <EditFuncionarioForm employee={func} clientes={clientes} />;
}
