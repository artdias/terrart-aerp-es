import NovoFuncionarioForm from "./NovoFuncionarioForm";
import { prisma } from "@/lib/prisma";

export default async function NovoFuncionarioPage() {
  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' },
    select: { id: true, companyName: true }
  });

  return <NovoFuncionarioForm clientes={clientes} />;
}
