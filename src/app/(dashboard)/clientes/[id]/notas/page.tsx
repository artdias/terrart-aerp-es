import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientNotasClient from "./ClientNotasClient";

export default async function ClientNotasPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const user = session.user as any;
  const isAllowed =
    user.role === "ADMIN" ||
    user.permissions?.allowClientes ||
    user.permissions?.allowFinanceiro ||
    user.permissions?.allowFaturamento;

  if (!isAllowed) {
    redirect("/");
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      invoices: {
        orderBy: { dueDate: "desc" }
      }
    }
  });

  if (!client || client.deleted) {
    notFound();
  }

  const serializedInvoices = client.invoices.map((inv) => ({
    id: inv.id,
    clientId: inv.clientId,
    description: inv.description,
    amount: inv.amount,
    dueDate: inv.dueDate.toISOString(),
    status: inv.status,
    fileUrl: inv.fileUrl,
    fileName: inv.fileName,
    cancellationReason: inv.cancellationReason,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString()
  }));

  return (
    <ClientNotasClient
      client={{
        id: client.id,
        companyName: client.companyName,
        name: client.name,
        cnpj: client.cnpj
      }}
      initialInvoices={serializedInvoices}
    />
  );
}
