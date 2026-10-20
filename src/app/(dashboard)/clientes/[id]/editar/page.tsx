import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditClientForm from "./EditClientForm";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditarClientePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  // Verificar permissão
  const userPermissions = (session.user as any).permissions || {};
  const isAdmin = (session.user as any).role === "ADMIN" || session.user.email === "admin";
  
  if (!isAdmin && !userPermissions.allowClientes) {
    redirect("/");
  }

  // Buscar cliente correspondente
  const client = await prisma.client.findUnique({
    where: { id: params.id }
  });

  if (!client || client.deleted) {
    redirect("/clientes");
  }

  const employees = await prisma.employee.findMany({
    where: { deleted: false },
    orderBy: { firstName: "asc" },
    include: { user: { select: { name: true } } }
  });

  const supervisors = employees
    .filter((emp) => (emp.roleTitle || "").toLowerCase().includes("supervisor") || emp.id === client.supervisorId)
    .map((emp) => ({
      id: emp.id,
      name: emp.user?.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Sem Nome",
      roleTitle: emp.roleTitle || "Supervisor",
      phone: emp.phone || null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <EditClientForm client={client} supervisors={supervisors} />;
}
