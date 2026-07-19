import { prisma } from "@/lib/prisma";
import NovoContratoForm from "./NovoContratoForm";

export default async function NovoContratoPage() {
  // Buscar lista de clientes ordenados por Razão Social
  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' },
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      address: true
    }
  });

  // Buscar todos os templates jurídicos disponíveis
  const templates = await prisma.documentTemplate.findMany({
    orderBy: { type: 'asc' }
  });

  return (
    <NovoContratoForm 
      clientes={clientes} 
      templates={templates} 
    />
  );
}
