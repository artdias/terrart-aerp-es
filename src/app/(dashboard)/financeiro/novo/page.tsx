import NovoFinanceiroForm from "./NovoFinanceiroForm";
import { prisma } from "@/lib/prisma";

export default async function NovoInvoicePage({ 
  searchParams 
}: { 
  searchParams: { clientId?: string } 
}) {
  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' },
    select: { id: true, companyName: true }
  });

  return <NovoFinanceiroForm clientes={clientes} defaultClientId={searchParams.clientId} />;
}
