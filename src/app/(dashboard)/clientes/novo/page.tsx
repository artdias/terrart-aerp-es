import NovoClienteForm from "./NovoClienteForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NovoClientePage() {
  const employees = await prisma.employee.findMany({
    where: { deleted: false },
    orderBy: { firstName: "asc" },
    include: { user: { select: { name: true } } }
  });

  const supervisors = employees
    .filter((emp) => (emp.roleTitle || "").toLowerCase().includes("supervisor"))
    .map((emp) => ({
      id: emp.id,
      name: emp.user?.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Sem Nome",
      roleTitle: emp.roleTitle || "Supervisor",
      phone: emp.phone || null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <NovoClienteForm supervisors={supervisors} />;
}
