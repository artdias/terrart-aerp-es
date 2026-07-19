import styles from "../clientes/clientes.module.css";
import { Plus, Briefcase, CalendarClock, DollarSign, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllocationStatus } from "@/lib/allocationStatus";
import ConcludeOrCancelModal from "@/components/ConcludeOrCancelModal";

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; sortBy?: string; order?: string; tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowEscalas) {
    redirect("/");
  }

  const search = searchParams?.search || "";
  const status = searchParams?.status || "";
  const sortBy = searchParams?.sortBy || "createdAt";
  const order = searchParams?.order || "desc";
  const tab = searchParams?.tab || "ativas";

  const andConditions: any[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { task: { contains: search } },
        { client: { companyName: { contains: search } } },
        { employee: { 
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { user: { name: { contains: search } } }
          ] 
        } }
      ]
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  const alocacoes = await prisma.jobAllocation.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : {},
    orderBy: {
      [sortBy]: order
    },
    include: { 
      employee: { include: { user: true } }, 
      client: true 
    }
  });

  // Filtragem Dinâmica por Aba (Tab)
  const filteredAlocacoes = alocacoes.filter(aloc => {
    const computedStatus = getAllocationStatus(aloc as any);
    const isHistorico = computedStatus === "Concluída" || computedStatus === "Cancelada" || computedStatus === "Incompleto";
    
    if (tab === "historico") {
      return isHistorico;
    } else {
      return !isHistorico;
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Escalas e Alocações</h1>
          <p className={styles.subtitle}>Gerencie onde os funcionários estão alocados, suas tarefas e os contratos.</p>
        </div>
        <Link href="/escalas/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Nova Alocação</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '2px solid #eee' }}>
        <Link 
          href={`/escalas?tab=ativas&search=${search}&sortBy=${sortBy}&order=${order}`} 
          style={{ 
            padding: '12px 8px', fontWeight: 600, fontSize: '1.05rem',
            color: tab === 'ativas' ? '#002244' : '#7f8c8d', 
            borderBottom: tab === 'ativas' ? '3px solid #002244' : '3px solid transparent', 
            textDecoration: 'none', marginBottom: '-2px', transition: 'all 0.2s'
          }}
        >
          Ativas & Pendentes
        </Link>
        <Link 
          href={`/escalas?tab=historico&search=${search}&sortBy=${sortBy}&order=${order}`} 
          style={{ 
            padding: '12px 8px', fontWeight: 600, fontSize: '1.05rem',
            color: tab === 'historico' ? '#002244' : '#7f8c8d', 
            borderBottom: tab === 'historico' ? '3px solid #002244' : '3px solid transparent', 
            textDecoration: 'none', marginBottom: '-2px', transition: 'all 0.2s'
          }}
        >
          Histórico (Concluídas e Canceladas)
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
        <SearchInput placeholder="Pesquise por func, cliente, tarefa..." />
        
        <FilterSelect 
          name="status"
          defaultValue={status}
          options={[
            { value: "", label: "Todos os Status" },
            { value: "Ativa", label: "Ativa" },
            { value: "Concluída", label: "Concluída" },
            { value: "Cancelada", label: "Cancelada" }
          ]}
        />

        <FilterSelect 
          name="sortBy"
          defaultValue={sortBy}
          options={[
            { value: "createdAt", label: "Ordenar por Data de Cadastro" },
            { value: "paymentValue", label: "Ordenar por Remuneração" }
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
          <Link href="/escalas" style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>
            Limpar Filtros
          </Link>
        ) : null}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Cliente (Local)</th>
              <th>Tarefa / Tempo</th>
              <th>Remuneração</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlocacoes.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Nenhuma alocação correspondente encontrada nesta aba.
                </td>
              </tr>
            ) : (
              filteredAlocacoes.map(aloc => {
                const computedStatus = getAllocationStatus(aloc as any);
                return (
                <tr key={aloc.id}>
                  <td>
                    <div className={styles.strongText}>{aloc.employee.user?.name || aloc.employee.firstName || "Sem Nome"}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{aloc.employee.roleTitle}</div>
                  </td>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Briefcase size={16} className={styles.icon} />
                      <div className={styles.strongText}>{aloc.client.companyName}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.strongText}>{aloc.task}</div>
                    {(aloc as any).startDate && (aloc as any).endDate && (
                      <div className={styles.cellWithIcon} style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                        <CalendarClock size={14} /> 
                        {new Date((aloc as any).startDate).toLocaleDateString('pt-BR')} até {new Date((aloc as any).endDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {aloc.duration && (
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px', fontStyle: 'italic' }}>
                        {aloc.duration}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.cellWithIcon} style={{ color: '#002244' }}>
                      <DollarSign size={16} className={styles.icon} />
                      <strong style={{ fontSize: '1.05rem' }}>
                        {aloc.paymentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '4px' }}>
                        / {aloc.paymentFrequency}
                      </span>
                    </div>
                  </td>
                  <td>
                    {computedStatus === "Ativa" ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <CheckCircle2 size={14} /> Ativa
                      </div>
                    ) : computedStatus === "Expirado" ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        Expirado
                      </div>
                    ) : computedStatus === "Incompleto" ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f39c12', fontWeight: 600, background: '#fef5e7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        Incompleto
                      </div>
                    ) : computedStatus === "Concluída" ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2980b9', fontWeight: 600, background: '#eaf2f8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <CheckCircle2 size={14} /> Concluída
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#7f8c8d', fontWeight: 600, background: '#f2f4f4', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {computedStatus}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {computedStatus !== "Concluída" && computedStatus !== "Cancelada" && computedStatus !== "Incompleto" && (
                        <ConcludeOrCancelModal allocationId={aloc.id} variant="tableBtn" />
                      )}
                      <Link 
                        href={`/escalas/${aloc.id}`} 
                        className={styles.actionBtn} 
                        style={{ background: '#3498db', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Visualizar
                      </Link>
                      <Link 
                        href={`/escalas/${aloc.id}/editar`} 
                        className={styles.actionBtn} 
                        style={{ background: '#f39c12', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
