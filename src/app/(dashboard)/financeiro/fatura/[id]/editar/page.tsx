import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditFaturaForm from "./EditFaturaForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditFaturaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFinanceiro) {
    redirect("/");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
  });

  if (!invoice) {
    notFound();
  }

  const clientes = await prisma.client.findMany({
    where: { deleted: false },
    orderBy: { companyName: 'asc' }
  });

  return <EditFaturaForm clientes={clientes} invoice={invoice} />;
}
