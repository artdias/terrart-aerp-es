import styles from "../clientes/clientes.module.css";
import { Plus, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteEmployee } from "@/actions/employeeActions";
import DeleteButton from "@/components/DeleteButton";

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; sortBy?: string; order?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFuncionarios) {
    redirect("/");
  }

  const search = searchParams?.search || "";
  const status = searchParams?.status || "";
  const sortBy = searchParams?.sortBy || "createdAt";
  const order = searchParams?.order || "desc";

  const andConditions: any[] = [{ deleted: false }];

  if (search) {
    andConditions.push({
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { cpf: { contains: search } },
        { roleTitle: { contains: search } },
        { user: { name: { contains: search } } }
      ]
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  const funcionarios = await prisma.employee.findMany({
    where: { deleted: false,  AND: andConditions },
    orderBy: {
      [sortBy]: order
    },
    include: { 
      user: true,
      workplace: { include: { client: true } } 
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Funcionários</h1>
          <p className={styles.subtitle}>Gerencie o cadastro de terceirizados e suas alocações.</p>
        </div>
        <Link href="/funcionarios/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Novo Funcionário</span>
        </Link>
      </div>

      {/* Barra de Filtros Reativa */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        border: '1px solid #eee'
      }}>
        <SearchInput placeholder="Pesquise por nome, CPF, cargo..." />
        
        <FilterSelect 
          name="status"
          defaultValue={status}
          options={[
            { value: "", label: "Todos os Status" },
            { value: "Ativo", label: "Ativo" },
            { value: "Inativo", label: "Inativo" },
            { value: "Ausente", label: "Ausente" },
            { value: "Entrevista", label: "Entrevista" }
          ]}
        />

        <FilterSelect 
          name="sortBy"
          defaultValue={sortBy}
          options={[
            { value: "firstName", label: "Ordenar por Nome" },
            { value: "roleTitle", label: "Ordenar por Cargo" },
            { value: "status", label: "Ordenar por Status" },
            { value: "createdAt", label: "Ordenar por Data de Cadastro" }
          ]}
        />

        <FilterSelect 
          name="order"
          defaultValue={order}
          options={[
            { value: "asc", label: "Ordem Crescente" },
            { value: "desc", label: "Ordem Decrescente" }
          ]}
        />

        {search || status || sortBy !== "createdAt" || order !== "desc" ? (
          <Link href="/funcionarios" style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>
            Limpar Filtros
          </Link>
        ) : null}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome / CPF</th>
              <th>Cargo</th>
              <th>Alocação (Posto)</th>
              <th>Status</th>
              <th>Data de Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Nenhum funcionário correspondente encontrado.
                </td>
              </tr>
            ) : (
              funcionarios.map(func => (
                <tr key={func.id}>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Users size={16} className={styles.icon} />
                      <div>
                        <div className={styles.strongText}>{func.user?.name || "Sem Nome"}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>CPF: {func.cpf}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Briefcase size={16} className={styles.icon} />
                      {func.roleTitle}
                    </div>
                  </td>
                  <td>
                    {func.workplace ? (
                      <div className={styles.cellWithIcon}>
                        <Briefcase size={16} className={styles.icon} />
                        <div>
                          <div className={styles.strongText}>{func.workplace.client.companyName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Posto: {func.workplace.name}</div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Não alocado</span>
                    )}
                  </td>
                  <td>
                    {func.status === "Ativo" ? (
                      <span style={{ color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Ativo</span>
                    ) : func.status === "Inativo" ? (
                      <span style={{ color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Inativo</span>
                    ) : func.status === "Ausente" ? (
                      <span style={{ color: '#f39c12', fontWeight: 600, background: '#fef5e7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Ausente</span>
                    ) : (
                      <span style={{ color: '#2980b9', fontWeight: 600, background: '#ebf5fb', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Entrevista</span>
                    )}
                  </td>
                  <td>
                    {func.createdAt.toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link 
                        href={`/funcionarios/${func.id}`} 
                        className={styles.actionBtn} 
                        style={{ background: '#3498db', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Visualizar
                      </Link>
                      <Link 
                        href={`/funcionarios/${func.id}/editar`} 
                        className={styles.actionBtn} 
                        style={{ background: '#f39c12', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Editar
                      </Link>
                      <DeleteButton 
                        action={deleteEmployee} 
                        id={func.id} 
                        name="employeeId" 
                        confirmText="Deseja mover este funcionário para a lixeira?" 
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
