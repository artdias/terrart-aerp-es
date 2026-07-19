import { prisma } from "@/lib/prisma";
import styles from "./clientes.module.css";
import { Plus, Building2, MapPin, FileText } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
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
    orderBy: {
      [sortBy]: order
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Gerencie as empresas contratantes e os postos de trabalho.</p>
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
        
        <FilterSelect 
          name="sortBy"
          defaultValue={sortBy}
          options={[
            { value: "companyName", label: "Ordenar por Razão Social" },
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
              <th>Empresa</th>
              <th>CNPJ</th>
              <th>Endereço</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  Nenhum cliente correspondente encontrado.
                </td>
              </tr>
            ) : (
              clientes.map(cliente => (
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
                  <td style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
