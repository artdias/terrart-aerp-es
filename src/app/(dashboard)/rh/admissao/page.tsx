import React from "react";
import styles from "../../clientes/clientes.module.css";
import Link from "next/link";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdmissaoListPage({ searchParams }: { searchParams: { search?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "ADMIN" && !user.permissions?.allowRh) redirect("/");

  const search = searchParams?.search || "";
  
  // Lista todos os funcionários que não estão Ativos
  const andConditions: any[] = [
    { deleted: false },
    { status: { not: "Ativo" } } // Inativo, Entrevista, etc.
  ];

  if (search) {
    andConditions.push({
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { cpf: { contains: search } }
      ]
    });
  }

  const candidatos = await prisma.employee.findMany({
    where: { AND: andConditions },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/rh" className={styles.backButton} style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Processo de Admissão</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Selecione um candidato para efetivar o contrato.</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <SearchInput placeholder="Buscar candidato (Nome, CPF)..." />
        </div>
        <Link 
          href="/funcionarios/novo"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0ea5e9', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
        >
          <UserPlus size={18} />
          Cadastrar Candidato
        </Link>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Candidato</th>
              <th>CPF</th>
              <th>Cargo / Pretensão</th>
              <th>Status Atual</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>Nenhum candidato pendente encontrado.</td>
              </tr>
            ) : (
              candidatos.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Users size={16} className={styles.icon} />
                      <span className={styles.strongText}>{c.firstName} {c.lastName}</span>
                    </div>
                  </td>
                  <td>{c.cpf}</td>
                  <td>{c.roleTitle || "-"}</td>
                  <td>
                    <span style={{ background: '#fef5e7', color: '#f39c12', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <Link 
                      href={`/rh/admissao/${c.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0ea5e9', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <UserPlus size={16} />
                      Iniciar Admissão
                    </Link>
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
