import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FileSpreadsheet, Building2, Users, Box, DollarSign, ShieldAlert, Download, Search, Filter } from "lucide-react";
import styles from "../clientes/clientes.module.css";
import Link from "next/link";

interface PageProps {
  searchParams: {
    tab?: string;
    search?: string;
    status?: string;
    category?: string;
    type?: string;
  };
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const isAdmin = user.role === "ADMIN";

  // Verificação de permissões modulares
  const canSeeClients = isAdmin || user.permissions?.allowClientes;
  const canSeeEmployees = isAdmin || user.permissions?.allowFuncionarios;
  const canSeeProducts = isAdmin || user.permissions?.allowEstoque;
  const canSeeFinance = isAdmin || user.permissions?.allowFinanceiro;
  const canSeeAuditoria = isAdmin; // Auditoria é restrito ao admin master

  // Bloqueio de página: pelo menos uma permissão é necessária
  const canSeeReports = isAdmin || user.permissions?.allowRelatorios;
  if (!canSeeReports) {
    redirect("/");
  }

  // Determinar aba padrão ativa com base em permissões
  let defaultTab = "";
  if (canSeeClients) defaultTab = "clientes";
  else if (canSeeEmployees) defaultTab = "funcionarios";
  else if (canSeeProducts) defaultTab = "estoque";
  else if (canSeeFinance) defaultTab = "financeiro";
  else if (canSeeAuditoria) defaultTab = "auditoria";

  const activeTab = searchParams.tab || defaultTab;
  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const category = searchParams.category || "";
  const type = searchParams.type || "";

  // Carregar dados e aplicar filtros
  let clientsData: any[] = [];
  let employeesData: any[] = [];
  let productsData: any[] = [];
  let financialData: any[] = [];
  let auditoriaData: any[] = [];

  if (activeTab === "clientes" && canSeeClients) {
    clientsData = await prisma.client.findMany({
      where: { deleted: false,
        OR: [
          { companyName: { contains: search } },
          { cnpj: { contains: search } },
          { name: { contains: search } }
        ]
      },
      orderBy: { companyName: 'asc' }
    });
  } else if (activeTab === "funcionarios" && canSeeEmployees) {
    employeesData = await prisma.employee.findMany({
      where: { deleted: false,
        status: status ? status : undefined,
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { cpf: { contains: search } }
        ]
      },
      include: { workplace: { include: { client: true } } },
      orderBy: { firstName: "asc" }
    });
  } else if (activeTab === "estoque" && canSeeProducts) {
    productsData = await prisma.product.findMany({
      where: { deleted: false,
        category: category ? category : undefined,
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } }
        ]
      },
      orderBy: { name: "asc" }
    });
  } else if (activeTab === "financeiro" && canSeeFinance) {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: status ? status : undefined,
        OR: [
          { description: { contains: search } },
          { client: { companyName: { contains: search } } }
        ]
      },
      include: { client: true }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        status: status ? status : undefined,
        description: { contains: search }
      }
    });

    for (const inv of invoices) {
      financialData.push({
        id: inv.id,
        type: "RECEITA",
        description: `Faturamento: ${inv.client.companyName}${inv.description ? ` (${inv.description})` : ""}`,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status
      });
    }

    for (const exp of expenses) {
      financialData.push({
        id: exp.id,
        type: "DESPESA",
        description: `${exp.description} [${exp.category}]`,
        amount: exp.amount,
        dueDate: exp.dueDate,
        status: exp.status
      });
    }

    if (type) {
      financialData = financialData.filter((item) => item.type === type);
    }

    financialData.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  } else if (activeTab === "auditoria" && canSeeAuditoria) {
    auditoriaData = await prisma.auditLog.findMany({
      where: {
        action: status ? status : undefined,
        OR: [
          { userName: { contains: search } },
          { details: { contains: search } }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
  }

  // Obter categorias distintas para estoque
  const distinctCategories = await prisma.product.findMany({
    where: { deleted: false },
    select: { category: true },
    distinct: ["category"]
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <FileSpreadsheet size={28} color="#003366" />
            Central de Relatórios e Exportação
          </h1>
          <p className={styles.subtitle}>
            Filtre, visualize os dados no painel e baixe planilhas atualizadas em tempo real.
          </p>
        </div>
      </div>

      {/* Navegação entre Categorias (Abas) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #eef2f6", paddingBottom: "12px" }}>
        {canSeeClients && (
          <Link
            href="/relatorios?tab=clientes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: activeTab === "clientes" ? "#003366" : "#f1f5f9",
              color: activeTab === "clientes" ? "white" : "#475569"
            }}
          >
            <Building2 size={16} /> Clientes
          </Link>
        )}

        {canSeeEmployees && (
          <Link
            href="/relatorios?tab=funcionarios"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: activeTab === "funcionarios" ? "#003366" : "#f1f5f9",
              color: activeTab === "funcionarios" ? "white" : "#475569"
            }}
          >
            <Users size={16} /> Funcionários
          </Link>
        )}

        {canSeeProducts && (
          <Link
            href="/relatorios?tab=estoque"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: activeTab === "estoque" ? "#003366" : "#f1f5f9",
              color: activeTab === "estoque" ? "white" : "#475569"
            }}
          >
            <Box size={16} /> Estoque
          </Link>
        )}

        {canSeeFinance && (
          <Link
            href="/relatorios?tab=financeiro"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: activeTab === "financeiro" ? "#003366" : "#f1f5f9",
              color: activeTab === "financeiro" ? "white" : "#475569"
            }}
          >
            <DollarSign size={16} /> Financeiro
          </Link>
        )}

        {canSeeAuditoria && (
          <Link
            href="/relatorios?tab=auditoria"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: activeTab === "auditoria" ? "#003366" : "#f1f5f9",
              color: activeTab === "auditoria" ? "white" : "#475569"
            }}
          >
            <ShieldAlert size={16} /> Auditoria (Logs)
          </Link>
        )}
      </div>

      {/* Painel de Filtros */}
      <div className={styles.card} style={{ padding: "20px", marginBottom: "24px" }}>
        <form method="GET" action="/relatorios" style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "16px" }}>
          <input type="hidden" name="tab" value={activeTab} />
          
          <div style={{ flex: 2, minWidth: "200px" }}>
            <label htmlFor="search" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Pesquisar por texto / palavra-chave</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Digite para filtrar..."
                style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          {/* Filtros específicos por Aba */}
          {activeTab === "funcionarios" && (
            <div style={{ minWidth: "150px" }}>
              <label htmlFor="status" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Status Contratual</label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Ausente">Ausente</option>
                <option value="Contrato">Contrato</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Negado">Negado</option>
              </select>
            </div>
          )}

          {activeTab === "estoque" && (
            <div style={{ minWidth: "150px" }}>
              <label htmlFor="category" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Categoria</label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="">Todas</option>
                {distinctCategories.map((c) => (
                  <option key={c.category || ""} value={c.category || ""}>{c.category || "Sem Categoria"}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "financeiro" && (
            <>
              <div style={{ minWidth: "150px" }}>
                <label htmlFor="type" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Tipo</label>
                <select
                  id="type"
                  name="type"
                  defaultValue={type}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
                >
                  <option value="">Receitas e Despesas</option>
                  <option value="RECEITA">Apenas Receitas</option>
                  <option value="DESPESA">Apenas Despesas</option>
                </select>
              </div>

              <div style={{ minWidth: "150px" }}>
                <label htmlFor="status" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Situação</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
                >
                  <option value="">Todas</option>
                  <option value="PAGO">Pago / Liquidado</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="ATRASADO">Atrasado</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "auditoria" && (
            <div style={{ minWidth: "150px" }}>
              <label htmlFor="status" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Ação</label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="">Todas</option>
                <option value="CREATE_USER">Criar Usuário</option>
                <option value="UPDATE_USER">Editar Usuário</option>
                <option value="DELETE_USER">Excluir Usuário</option>
                <option value="RESTORE_TRASH">Restaurar Excluído</option>
                <option value="PERMANENT_DELETE">Excluir Permanente</option>
                <option value="STOCK_CHANGE">Movimentação Estoque</option>
                <option value="CREATE_INTERVIEW">Entrevista Gravada</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f1f5f9",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                padding: "10px 16px",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Filter size={16} /> Filtrar
            </button>

            <a
              href={`/api/reports/${activeTab === "auditoria" ? "auditoria" : activeTab}/export?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&category=${encodeURIComponent(category)}&type=${encodeURIComponent(type)}`}
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#27ae60",
                color: "white",
                padding: "10px 16px",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              <Download size={16} /> Exportar Filtrados (.csv)
            </a>
          </div>
        </form>
      </div>

      {/* Pré-visualização da Tabela */}
      <div className={styles.card}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ color: "#003366", fontSize: "0.95rem" }}>
            Pré-visualização dos Resultados 
            {activeTab === "clientes" && ` (${clientsData.length} encontrados)`}
            {activeTab === "funcionarios" && ` (${employeesData.length} encontrados)`}
            {activeTab === "estoque" && ` (${productsData.length} encontrados)`}
            {activeTab === "financeiro" && ` (${financialData.length} encontrados)`}
            {activeTab === "auditoria" && ` (${auditoriaData.length} encontrados)`}
          </strong>
        </div>

        {/* Renderização condicional de tabelas */}
        {activeTab === "clientes" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Razão Social</th>
                <th>CNPJ</th>
                <th>Nome Fantasia</th>
                <th>Cidade/UF</th>
                <th>Telefone</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {clientsData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>Nenhum cliente atende aos filtros de pesquisa.</td>
                </tr>
              ) : (
                clientsData.slice(0, 30).map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.companyName}</strong></td>
                    <td><code>{c.cnpj}</code></td>
                    <td>{c.name}</td>
                    <td>{c.city}/{c.state}</td>
                    <td>{c.phone || c.cellphone}</td>
                    <td>{c.managerName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "funcionarios" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>CPF</th>
                <th>Função / Cargo</th>
                <th>Salário</th>
                <th>Posto Atual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employeesData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>Nenhum funcionário atende aos filtros de pesquisa.</td>
                </tr>
              ) : (
                employeesData.slice(0, 30).map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.firstName} {e.lastName}</strong></td>
                    <td><code>{e.cpf}</code></td>
                    <td>{e.roleTitle}</td>
                    <td>R$ {e.salary?.toFixed(2) || "0,00"}</td>
                    <td>{e.workplace?.name || "Não alocado"}</td>
                    <td>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: e.status === "Ativo" || e.status === "Contrato" ? "#eefbf4" : e.status === "Ausente" || e.status === "Em Análise" ? "#fef5e7" : "#fdedec",
                        color: e.status === "Ativo" || e.status === "Contrato" ? "#27ae60" : e.status === "Ausente" || e.status === "Em Análise" ? "#f39c12" : "#e74c3c"
                      }}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "estoque" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item / Material</th>
                <th>SKU</th>
                <th>Categoria</th>
                <th>Especificação</th>
                <th>Qtd Central</th>
                <th>Qtd Mínima</th>
                <th>Preço Unit.</th>
              </tr>
            </thead>
            <tbody>
              {productsData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>Nenhum material atende aos filtros de pesquisa.</td>
                </tr>
              ) : (
                productsData.slice(0, 30).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><code>{p.sku}</code></td>
                    <td>{p.category}</td>
                    <td>{p.size || "-"} ({p.modelType || "Unissex"})</td>
                    <td>{p.quantity} {p.unit}</td>
                    <td>{p.minQuantity} {p.unit}</td>
                    <td>R$ {p.price?.toFixed(2) || "0,00"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "financeiro" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Lançamento / Descrição</th>
                <th>Valor</th>
                <th>Data Vencimento</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {financialData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>Nenhum registro de fluxo atende aos filtros de pesquisa.</td>
                </tr>
              ) : (
                financialData.slice(0, 30).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: item.type === "RECEITA" ? "#eefbf4" : "#fdedec",
                        color: item.type === "RECEITA" ? "#27ae60" : "#e74c3c"
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td><strong>{item.description}</strong></td>
                    <td>R$ {item.amount.toFixed(2)}</td>
                    <td>{new Date(item.dueDate).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: item.status === "PAGO" || item.status === "LIQUIDADO" ? "#eefbf4" : "#fdedec",
                        color: item.status === "PAGO" || item.status === "LIQUIDADO" ? "#27ae60" : "#e74c3c"
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "auditoria" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes do Histórico</th>
              </tr>
            </thead>
            <tbody>
              {auditoriaData.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>Nenhum log correspondente aos filtros foi registrado.</td>
                </tr>
              ) : (
                auditoriaData.slice(0, 30).map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                    <td><code>{log.userName}</code></td>
                    <td><strong>{log.action}</strong></td>
                    <td style={{ color: "#555", fontSize: "0.85rem" }}>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {(clientsData.length > 30 || employeesData.length > 30 || productsData.length > 30 || financialData.length > 30 || auditoriaData.length > 30) && (
          <div style={{ padding: "12px 20px", background: "#f8fafc", color: "#64748b", fontSize: "0.8rem", textAlign: "center", fontStyle: "italic", borderTop: "1px solid #f1f5f9" }}>
            Exibindo as primeiras 30 linhas na pré-visualização. Use a exportação em CSV para obter os resultados completos filtrados.
          </div>
        )}
      </div>
    </div>
  );
}
