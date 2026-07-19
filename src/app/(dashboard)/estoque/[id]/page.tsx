import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, Box, AlertTriangle, Shield, CheckCircle, PackageOpen, HelpCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { allocateProductToClient, deallocateProductFromClient } from "@/actions/inventoryActions";

export default async function ProdutoDetalhePage({ params }: { params: { id: string } }) {
  // Buscar a lista de clientes para alimentar o dropdown de alocação
  const clients = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  const prod = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      employeeLoans: {
        orderBy: { borrowedAt: 'desc' },
        include: { employee: { include: { user: true } } }
      },
      allocations: {
        orderBy: { allocatedAt: 'desc' },
        include: { client: true }
      }
    }
  });

  if (!prod) {
    return notFound();
  }

  // Filtrar retiradas em uso e devolvidas
  const emUso = prod.employeeLoans.filter(e => e.status === "EM USO");
  const historico = prod.employeeLoans.filter(e => e.status === "DEVOLVIDO");
  
  // Totais
  const totalAllocatedClients = prod.allocations.reduce((acc, a) => acc + a.quantity, 0);
  const totalBorrowedEmployees = emUso.reduce((acc, l) => acc + l.quantity, 0);
  const grandTotal = prod.quantity + totalAllocatedClients + totalBorrowedEmployees;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/estoque" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Ficha do Material</h1>
            <p className={styles.subtitle}>Informações de estoque, especificações e alocações vinculadas.</p>
          </div>
          <Link 
            href={`/estoque/${prod.id}/editar`} 
            className={styles.actionBtn} 
            style={{ background: '#f39c12', color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Editar Produto
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' }}>
        
        {/* Lado Esquerdo - Detalhes & Alocações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1 - Detalhes Básicos */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={18} style={{ color: '#002244' }} /> Especificações do Material
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Nome do Produto:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{prod.name}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Categoria:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{prod.category || "Não definida"}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Modelo / Tipo:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{prod.modelType || "Não definido"}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Tamanho:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{prod.size || "Não definido"}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>SKU / Código Único:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#555', fontSize: '0.85rem' }}>{prod.sku}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Unidade de Medida:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{prod.unit}</p>
              </div>
            </div>
            
            {prod.description && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #f3f3f3', paddingTop: '12px' }}>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Descrição detalhada:</strong>
                <p style={{ margin: '4px 0 0', color: '#444', fontSize: '0.9rem', lineHeight: '1.4' }}>{prod.description}</p>
              </div>
            )}
          </div>

          {/* Card 2 - Armazenado / Alocado nos Clientes (NOVO) */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageOpen size={18} style={{ color: '#27ae60' }} /> Armazenado / Alocado nos Clientes
            </h3>
            {prod.allocations.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic', marginTop: '16px' }}>
                Nenhuma unidade deste produto está atualmente alocada ou armazenada com clientes.
              </p>
            ) : (
              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '8px' }}>Cliente</th>
                      <th style={{ padding: '8px' }}>Qtd Alocada</th>
                      <th style={{ padding: '8px' }}>Alocado em</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prod.allocations.map((alloc) => (
                      <tr key={alloc.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>
                          {alloc.client.companyName}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#27ae60' }}>
                          {alloc.quantity} {prod.unit}
                        </td>
                        <td style={{ padding: '8px', color: '#666' }}>
                          {alloc.allocatedAt.toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <form action={deallocateProductFromClient} style={{ display: 'inline' }}>
                            <input type="hidden" name="allocationId" value={alloc.id} />
                            <button 
                              type="submit" 
                              style={{ 
                                background: '#c0392b', 
                                color: 'white', 
                                border: 'none', 
                                padding: '6px 10px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600, 
                                cursor: 'pointer' 
                              }}
                            >
                              Retornar ao Estoque Central
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 3 - Cautelas Ativas (Em Uso) */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: '#e67e22' }} /> Atribuídos aos Funcionários (Em Uso)
            </h3>
            {emUso.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic', marginTop: '16px' }}>
                Nenhuma unidade deste produto está atualmente atribuída a colaboradores.
              </p>
            ) : (
              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '8px' }}>Funcionário</th>
                      <th style={{ padding: '8px' }}>Qtd Retirada</th>
                      <th style={{ padding: '8px' }}>Data de Retirada</th>
                      <th style={{ padding: '8px' }}>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emUso.map((loan) => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>
                          {loan.employee.user?.name || loan.employee.firstName}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#e67e22' }}>
                          {loan.quantity} {prod.unit}
                        </td>
                        <td style={{ padding: '8px', color: '#666' }}>
                          {loan.borrowedAt.toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '8px', fontSize: '0.8rem', color: '#777' }}>
                          {loan.observations || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 4 - Histórico de Devoluções */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} style={{ color: '#27ae60' }} /> Histórico de Devoluções de Colaboradores
            </h3>
            {historico.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic', marginTop: '16px' }}>
                Ainda não há registros de devoluções para este material.
              </p>
            ) : (
              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '8px' }}>Funcionário</th>
                      <th style={{ padding: '8px' }}>Qtd Devolvida</th>
                      <th style={{ padding: '8px' }}>Retirada em</th>
                      <th style={{ padding: '8px' }}>Devolvido em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((loan) => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid #f3f3f3', color: '#555' }}>
                        <td style={{ padding: '8px' }}>
                          {loan.employee.user?.name || loan.employee.firstName}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>
                          {loan.quantity} {prod.unit}
                        </td>
                        <td style={{ padding: '8px', color: '#888' }}>
                          {loan.borrowedAt.toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 600, color: '#27ae60' }}>
                          {loan.returnedAt?.toLocaleDateString('pt-BR') || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Lado Direito - Status / Quantidade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card Quantidade Central */}
          <div className={styles.card} style={{ padding: '20px', textAlign: 'center' }}>
            <strong style={{ color: '#666', fontSize: '0.85rem' }}>QUANTIDADE CENTRAL</strong>
            <p style={{ margin: '8px 0 4px', fontSize: '3rem', fontWeight: 800, color: '#002244' }}>
              {prod.quantity}
              <span style={{ fontSize: '1.2rem', fontWeight: 500, color: '#777', marginLeft: '4px' }}>{prod.unit}</span>
            </p>
            <div style={{ margin: '12px 0 0' }}>
              {prod.quantity <= prod.minQuantity ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>
                  <AlertTriangle size={14} /> Estoque Baixo
                </div>
              ) : (
                <span style={{ color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem', display: 'inline-block' }}>Estoque Adequado</span>
              )}
            </div>
          </div>

          {/* Card Distribuição Detalhada (NOVO) */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#002244' }}>
              <PackageOpen size={16} /> Resumo de Distribuição
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '6px' }}>
                <span style={{ color: '#666', fontWeight: 600 }}>Total em Posse:</span>
                <strong style={{ color: '#003366', fontSize: '0.95rem' }}>{grandTotal} {prod.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#777' }}>🏠 Estoque Central:</span>
                <strong>{prod.quantity} {prod.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#777' }}>🏢 Alocado em Clientes:</span>
                <strong style={{ color: '#27ae60' }}>{totalAllocatedClients} {prod.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#777' }}>👤 Com Funcionários:</span>
                <strong style={{ color: '#e67e22' }}>{totalBorrowedEmployees} {prod.unit}</strong>
              </div>
            </div>
          </div>

          {/* Formulário - Alocar para Cliente (NOVO) */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#002244' }}>
              <HelpCircle size={16} /> Alocar para Cliente
            </h4>
            <form action={allocateProductToClient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="hidden" name="productId" value={prod.id} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="clientId" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>Cliente de Destino <span style={{ color: '#e74c3c' }}>*</span></label>
                <select 
                  id="clientId"
                  name="clientId" 
                  required 
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', background: 'white' }}
                >
                  <option value="">-- Selecione o Cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="quantity" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>Quantidade a Alocar <span style={{ color: '#e74c3c' }}>*</span></label>
                <input 
                  type="number" 
                  id="quantity" 
                  name="quantity" 
                  min="1" 
                  max={prod.quantity} 
                  required 
                  placeholder={`Máx: ${prod.quantity}`}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', width: '100%' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={prod.quantity <= 0}
                style={{ 
                  background: prod.quantity <= 0 ? '#ccc' : '#27ae60', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  fontWeight: 600, 
                  fontSize: '0.85rem', 
                  cursor: prod.quantity <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  marginTop: '4px'
                }}
              >
                Confirmar Alocação
              </button>
            </form>
          </div>

          {/* Card Configurações de Estoque */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageOpen size={16} style={{ color: '#002244' }} /> Parâmetros de Alerta
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Estoque Mínimo:</span>
                <strong style={{ color: '#1a1a1a' }}>{prod.minQuantity} {prod.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Preço Unitário:</span>
                <strong style={{ color: '#1a1a1a' }}>R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
