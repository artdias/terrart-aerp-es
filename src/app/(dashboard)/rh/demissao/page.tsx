import React from "react";
import styles from "../../clientes/clientes.module.css";
import Link from "next/link";
import { ArrowLeft, UserMinus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DemissaoListPage({ searchParams }: { searchParams: { search?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "ADMIN" && !user.permissions?.allowRh) redirect("/");

  const search = searchParams?.search || "";
  
  // Lista todos os funcionários que estão Ativos
  const andConditions: any[] = [
    { deleted: false },
    { status: "Ativo" }
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

  const ativos = await prisma.employee.findMany({
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
            <h1 className={styles.title} style={{ margin: 0 }}>Processo de Demissão</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Selecione o funcionário ativo para iniciar o desligamento.</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <SearchInput placeholder="Buscar funcionário ativo (Nome, CPF)..." />
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>CPF</th>
              <th>Cargo</th>
              <th>Status Atual</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {ativos.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>Nenhum funcionário ativo encontrado.</td>
              </tr>
            ) : (
              ativos.map(c => (
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
                    <span style={{ background: '#eafaf1', color: '#27ae60', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <Link 
                      href={`/rh/demissao/${c.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <UserMinus size={16} />
                      Iniciar Demissão
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
