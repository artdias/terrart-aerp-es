import React from "react";
import { prisma } from "@/lib/prisma";
import EditContractForm from "./EditContractForm";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditContractPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFaturamento) {
    redirect("/");
  }

  const contract = await prisma.clientContract.findUnique({
    where: { id: params.id }
  });

  if (!contract) {
    return notFound();
  }

  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  return <EditContractForm contract={contract} clientes={clientes} />;
}
