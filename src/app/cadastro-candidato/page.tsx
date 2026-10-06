import NovoFuncionarioForm from "../(dashboard)/funcionarios/novo/NovoFuncionarioForm";
import { prisma } from "@/lib/prisma";

export default async function CadastroCandidatoPage() {
  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' },
    select: { id: true, companyName: true }
  });

  const cargos = await prisma.jobRole.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const jornadas = await prisma.shiftPattern.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '12px 8px', maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <NovoFuncionarioForm clientes={clientes} cargos={cargos} jornadas={jornadas} isPublic={true} />
      </div>
    </div>
  );
}
