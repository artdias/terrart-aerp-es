import styles from "../clientes/clientes.module.css";
import { Plus, Package, AlertTriangle, Box } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteProduct } from "@/actions/inventoryActions";
import DeleteButton from "@/components/DeleteButton";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; sortBy?: string; order?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowEstoque) {
    redirect("/");
  }

  const search = searchParams?.search || "";
  const category = searchParams?.category || "";
  const sortBy = searchParams?.sortBy || "name";
  const order = searchParams?.order || "asc";

  const andConditions: any[] = [{ deleted: false }];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search } },
        { category: { contains: search } },
        { modelType: { contains: search } },
        { size: { contains: search } }
      ]
    });
  }

  if (category) {
    andConditions.push({ category });
  }

  const produtos = await prisma.product.findMany({
    where: { deleted: false,  AND: andConditions },
    orderBy: {
      [sortBy]: order
    },
    include: {
      allocations: {
        include: { client: true }
      },
      employeeLoans: {
        where: { status: "EM USO" },
        include: { employee: { include: { user: true } } }
      }
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Estoque Central</h1>
          <p className={styles.subtitle}>Controle os materiais disponíveis (limpeza, equipamentos, EPIs).</p>
        </div>
        <Link href="/estoque/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Novo Produto</span>
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
        <SearchInput placeholder="Pesquise por nome, modelo, tamanho..." />
        
        <FilterSelect 
          name="category"
          defaultValue={category}
          options={[
            { value: "", label: "Todas as Categorias" },
            { value: "Uniforme", label: "Uniforme" },
            { value: "EPI", label: "EPI" },
            { value: "Limpeza", label: "Limpeza" },
            { value: "Ferramenta", label: "Ferramenta" },
            { value: "Outro", label: "Outro" }
          ]}
        />

        <FilterSelect 
          name="sortBy"
          defaultValue={sortBy}
          options={[
            { value: "name", label: "Ordenar por Nome" },
            { value: "quantity", label: "Ordenar por Quantidade" },
            { value: "minQuantity", label: "Ordenar por Estoque Mínimo" },
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

        {search || category || sortBy !== "name" || order !== "asc" ? (
          <Link href="/estoque" style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>
            Limpar Filtros
          </Link>
        ) : null}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Estoque Central</th>
              <th>Localização / Distribuição</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Nenhum produto correspondente encontrado.
                </td>
              </tr>
            ) : (
              produtos.map(prod => {
                const totalAllocatedClients = prod.allocations.reduce((acc, a) => acc + a.quantity, 0);
                const totalBorrowedEmployees = prod.employeeLoans.reduce((acc, l) => acc + l.quantity, 0);
                const grandTotal = prod.quantity + totalAllocatedClients + totalBorrowedEmployees;

                return (
                  <tr key={prod.id}>
                    <td>
                      <div className={styles.cellWithIcon}>
                        <Package size={16} className={styles.icon} />
                        <div>
                          <div className={styles.strongText}>{prod.name}</div>
                          {(prod.category || prod.modelType || prod.size) && (
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                              {[prod.category, prod.modelType, prod.size ? `Tam: ${prod.size}` : ''].filter(Boolean).join(' | ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{prod.unit}</td>
                    <td>
                      <strong style={{ fontSize: '1.1rem', color: '#002244' }}>{prod.quantity}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#333' }}>Total em Posse:</span> <strong>{grandTotal}</strong> {prod.unit}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', borderLeft: '2px solid #ddd', paddingLeft: '6px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <div>🏠 Estoque Central: <strong>{prod.quantity}</strong></div>
                          {totalAllocatedClients > 0 && (
                            <div style={{ color: '#27ae60' }}>🏢 Clientes: <strong>{totalAllocatedClients}</strong> ({prod.allocations.length} alocações)</div>
                          )}
                          {totalBorrowedEmployees > 0 && (
                            <div style={{ color: '#e67e22' }}>👤 Funcionários: <strong>{totalBorrowedEmployees}</strong> ({prod.employeeLoans.length} em uso)</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {prod.quantity <= prod.minQuantity ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          <AlertTriangle size={14} /> Estoque Baixo
                        </div>
                      ) : (
                        <span style={{ color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Adequado</span>
                      )}
                    </td>
                    <td style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Link 
                        href={`/estoque/${prod.id}`} 
                        className={styles.actionBtn} 
                        style={{ background: '#3498db', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block' }}
                      >
                        Detalhes
                      </Link>
                      <Link 
                        href={`/estoque/${prod.id}/editar`} 
                        className={styles.actionBtn} 
                        style={{ background: '#f39c12', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
                      >
                        Editar
                      </Link>
                      <DeleteButton 
                        action={deleteProduct} 
                        id={prod.id} 
                        name="productId" 
                        confirmText="Deseja mover este produto para a lixeira?" 
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
