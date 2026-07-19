import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditDespesaForm from "./EditDespesaForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditDespesaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFinanceiro) {
    redirect("/");
  }

  const expense = await prisma.expense.findUnique({
    where: { id: params.id },
  });

  if (!expense) {
    notFound();
  }

  return <EditDespesaForm expense={expense} />;
}
