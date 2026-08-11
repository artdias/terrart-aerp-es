import React from "react";
import { prisma } from "@/lib/prisma";
import NovoContratoForm from "./NovoContratoForm";

export default async function NovoContratoPage() {
  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  return <NovoContratoForm clientes={clientes} />;
}

