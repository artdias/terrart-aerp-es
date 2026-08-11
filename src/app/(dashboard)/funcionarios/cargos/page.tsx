import styles from "../../clientes/clientes.module.css";
import { Plus, Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import { deleteRole } from "@/actions/roleActions";

export default async function CargosPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFuncionarios) {
    redirect("/");
  }

  const cargos = await prisma.jobRole.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Link href="/funcionarios" style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Voltar
            </Link>
          </div>
          <h1 className={styles.title}>Cargos da Empresa</h1>
          <p className={styles.subtitle}>Cadastre os cargos disponíveis para os funcionários.</p>
        </div>
        <Link href="/funcionarios/cargos/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Novo Cargo</span>
        </Link>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome do Cargo</th>
              <th>Descrição</th>
              <th>Data de Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cargos.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  Nenhum cargo cadastrado ainda.
                </td>
              </tr>
            ) : (
              cargos.map(cargo => (
                <tr key={cargo.id}>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Briefcase size={16} className={styles.icon} />
                      <div className={styles.strongText}>{cargo.name}</div>
                    </div>
                  </td>
                  <td>{cargo.description || "-"}</td>
                  <td>{cargo.createdAt.toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <DeleteButton 
                        action={deleteRole} 
                        id={cargo.id} 
                        name="roleId" 
                        confirmText={`Deseja realmente excluir o cargo '${cargo.name}'?`} 
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
