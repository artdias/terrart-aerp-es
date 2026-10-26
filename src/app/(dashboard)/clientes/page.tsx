import { prisma } from "@/lib/prisma";
import styles from "./clientes.module.css";
import { Plus, Building2, MapPin, FileText, Receipt, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/SearchInput";
import SortableHeader from "@/components/SortableHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteClient } from "@/actions/clientActions";
import DeleteButton from "@/components/DeleteButton";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { search?: string; sortBy?: string; order?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowClientes) {
    redirect("/");
  }

  const search = searchParams?.search || "";
  const sortBy = searchParams?.sortBy || "createdAt";
  const order = searchParams?.order || "desc";

  // Busca todos os clientes filtrados e ordenados direto do banco de dados (Server Component)
  const clientes = await prisma.client.findMany({
    where: { deleted: false,
      ...(search ? {
        OR: [
          { companyName: { contains: search } },
          { cnpj: { contains: search } },
          { address: { contains: search } }
        ]
      } : {})
    },
    include: {
      invoices: {
        where: { status: { not: "CANCELED" } }
      }
    },
    orderBy: {
      [sortBy]: order
    }
  });

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Gerencie as empresas contratantes, postos de trabalho e financeiro de notas mensais.</p>
        </div>
        <Link href="/clientes/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Novo Cliente</span>
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
        <SearchInput placeholder="Pesquise por nome, CNPJ ou endereço..." />

        {search || sortBy !== "createdAt" || order !== "desc" ? (
          <Link href="/clientes" style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>
            Limpar Filtros
          </Link>
        ) : null}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th><SortableHeader label="Empresa" value="companyName" /></th>
              <th><SortableHeader label="CNPJ" value="cnpj" /></th>
              <th><SortableHeader label="Endereço" value="address" /></th>
              <th>Notas Fiscais</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  Nenhum cliente correspondente encontrado.
                </td>
              </tr>
            ) : (
              clientes.map(cliente => {
                const overdueNotes = cliente.invoices.filter(inv => {
                  if (inv.status === "PAID") return false;
                  const d = new Date(inv.dueDate);
                  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
                  return dMidnight < todayMidnight;
                });
                const pendingNotes = cliente.invoices.filter(inv => inv.status !== "PAID");

                return (
                <tr key={cliente.id}>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Building2 size={16} className={styles.icon} />
                      <span className={styles.strongText}>{cliente.companyName}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <FileText size={16} className={styles.icon} />
                      {cliente.cnpj}
                    </div>
                  </td>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <MapPin size={16} className={styles.icon} />
                      {cliente.address}
                    </div>
                  </td>
                  <td>
                    {overdueNotes.length > 0 ? (
                      <Link
                        href={`/clientes/${cliente.id}/notas`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          border: "1px solid #fca5a5"
                        }}
                      >
                        <AlertTriangle size={13} />
                        {overdueNotes.length} não paga(s) na data
                      </Link>
                    ) : pendingNotes.length > 0 ? (
                      <Link
                        href={`/clientes/${cliente.id}/notas`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#fef3c7",
                          color: "#b45309",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          border: "1px solid #fcd34d"
                        }}
                      >
                        {pendingNotes.length} pendente(s) no prazo
                      </Link>
                    ) : cliente.invoices.length > 0 ? (
                      <Link
                        href={`/clientes/${cliente.id}/notas`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          border: "1px solid #86efac"
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Em dia ({cliente.invoices.length})
                      </Link>
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Sem notas</span>
                    )}
                  </td>
                  <td style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <Link
                      href={`/clientes/${cliente.id}/notas`}
                      className={styles.actionBtn}
                      style={{
                        background: "#0284c7",
                        color: "white",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: 600
                      }}
                    >
                      <Receipt size={15} />
                      Financeiro de Notas
                    </Link>
                    <Link href={`/clientes/${cliente.id}`} className={styles.actionBtn} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      Ver Detalhes
                    </Link>
                    <Link 
                      href={`/clientes/${cliente.id}/editar`} 
                      className={styles.actionBtn} 
                      style={{ background: "#f39c12", color: "white", textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600 }}
                    >
                      Editar
                    </Link>
                    <DeleteButton 
                      action={deleteClient} 
                      id={cliente.id} 
                      name="clientId" 
                      confirmText="Deseja mover este cliente para a lixeira?" 
                    />
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
