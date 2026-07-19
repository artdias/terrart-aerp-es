import EditEscalaForm from "./EditEscalaForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditarEscalaPage({ params }: { params: { id: string } }) {
  const aloc = await prisma.jobAllocation.findUnique({
    where: { id: params.id },
  });

  if (!aloc) {
    return notFound();
  }

  const funcionarios = await prisma.employee.findMany({
    where: { deleted: false },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  return (
    <EditEscalaForm 
      allocation={aloc} 
      funcionarios={funcionarios} 
      clientes={clientes} 
    />
  );
}
