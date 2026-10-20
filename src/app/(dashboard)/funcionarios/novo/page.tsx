import NovoFuncionarioForm from "./NovoFuncionarioForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NovoFuncionarioPage() {
  const clientesRaw = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' },
    select: {
      id: true,
      companyName: true,
      supervisor: {
        include: { user: { select: { name: true } } }
      }
    }
  });

  const clientes = clientesRaw.map(c => ({
    id: c.id,
    companyName: c.companyName,
    supervisorName: c.supervisor ? (c.supervisor.user?.name || `${c.supervisor.firstName || ""} ${c.supervisor.lastName || ""}`.trim()) : null,
    supervisorPhone: c.supervisor?.phone || null
  }));

  const cargos = await prisma.jobRole.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const jornadas = await prisma.shiftPattern.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const employees = await prisma.employee.findMany({
    where: { deleted: false },
    orderBy: { firstName: 'asc' },
    include: { user: { select: { name: true } } }
  });

  const supervisors = employees
    .map((emp) => ({
      id: emp.id,
      name: emp.user?.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Sem Nome",
      roleTitle: emp.roleTitle || "Colaborador",
      phone: emp.phone || ""
    }))
    .sort((a, b) => {
      const aIsSup = a.roleTitle.toLowerCase().includes("supervisor") ? 0 : 1;
      const bIsSup = b.roleTitle.toLowerCase().includes("supervisor") ? 0 : 1;
      if (aIsSup !== bIsSup) return aIsSup - bIsSup;
      return a.name.localeCompare(b.name);
    });

  return <NovoFuncionarioForm clientes={clientes} cargos={cargos} jornadas={jornadas} supervisors={supervisors} />;
}
