import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  FileSpreadsheet,
  Building2,
  Users,
  Box,
  DollarSign,
  ShieldAlert,
  Download,
  Search,
  Filter,
  Phone,
  Briefcase,
  XCircle,
} from "lucide-react";
import styles from "../clientes/clientes.module.css";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReportActionsClient from "./ReportActionsClient";

interface PageProps {
  searchParams: {
    tab?: string;
    search?: string;
    status?: string;
    category?: string;
    type?: string;
    role?: string;
    clientId?: string;
    fields?: string;
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

  // Determinar aba padrão ativa com base em permissões (priorizando Funcionários)
  let defaultTab = "";
  if (canSeeEmployees) defaultTab = "funcionarios";
  else if (canSeeClients) defaultTab = "clientes";
  else if (canSeeProducts) defaultTab = "estoque";
  else if (canSeeFinance) defaultTab = "financeiro";
  else if (canSeeAuditoria) defaultTab = "auditoria";

  const activeTab = searchParams.tab || defaultTab;
  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const category = searchParams.category || "";
  const type = searchParams.type || "";
  const roleFilter = searchParams.role || "";
  const clientIdFilter = searchParams.clientId || "";
  const fieldsMode = searchParams.fields || "completo";

  // Carregar dados e aplicar filtros
  let clientsData: any[] = [];
  let employeesData: any[] = [];
  let productsData: any[] = [];
  let financialData: any[] = [];
  let auditoriaData: any[] = [];
  let availableRoles: string[] = [];
  let availableClients: { id: string; companyName: string }[] = [];

  if (activeTab === "funcionarios" && canSeeEmployees) {
    // Carregar categorias/cargos disponíveis (JobRole + cargos existentes nos funcionários)
    const [jobRoles, distinctEmpRoles, allClients] = await Promise.all([
      prisma.jobRole.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
      prisma.employee.findMany({
        where: { deleted: false },
        select: { roleTitle: true },
        distinct: ["roleTitle"],
      }),
      prisma.client.findMany({
        where: { deleted: false },
        select: { id: true, companyName: true },
        orderBy: { companyName: "asc" },
      }),
    ]);

    availableClients = allClients;

    const roleSet = new Set<string>();
    jobRoles.forEach((r) => {
      if (r.name?.trim()) roleSet.add(r.name.trim());
    });
    distinctEmpRoles.forEach((e) => {
      if (e.roleTitle?.trim()) roleSet.add(e.roleTitle.trim());
    });
    availableRoles = Array.from(roleSet).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const andConditions: any[] = [{ deleted: false }];

    if (status) {
      andConditions.push({ status });
    }

    if (roleFilter) {
      andConditions.push({
        roleTitle: { contains: roleFilter, mode: "insensitive" },
      });
    }

    if (clientIdFilter) {
      andConditions.push({
        workplace: { clientId: clientIdFilter },
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { cpf: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { roleTitle: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    employeesData = await prisma.employee.findMany({
      where: { AND: andConditions },
      include: {
        user: true,
        workplace: { include: { client: true } },
      },
      orderBy: { firstName: "asc" },
    });
  } else if (activeTab === "clientes" && canSeeClients) {
    clientsData = await prisma.client.findMany({
      where: {
        deleted: false,
        ...(search
          ? {
              OR: [
                { companyName: { contains: search, mode: "insensitive" } },
                { cnpj: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { cellphone: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { companyName: "asc" },
    });
  } else if (activeTab === "estoque" && canSeeProducts) {
    productsData = await prisma.product.findMany({
      where: {
        deleted: false,
        category: category ? category : undefined,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
  } else if (activeTab === "financeiro" && canSeeFinance) {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: status ? status : undefined,
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                { client: { companyName: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { client: true },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        status: status ? status : undefined,
        ...(search ? { description: { contains: search, mode: "insensitive" } } : {}),
      },
    });

    for (const inv of invoices) {
      financialData.push({
        id: inv.id,
        type: "RECEITA",
        description: `Faturamento: ${inv.client.companyName}${inv.description ? ` (${inv.description})` : ""}`,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status,
      });
    }

    for (const exp of expenses) {
      financialData.push({
        id: exp.id,
        type: "DESPESA",
        description: `${exp.description} [${exp.category}]`,
        amount: exp.amount,
        dueDate: exp.dueDate,
        status: exp.status,
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
        ...(search
          ? {
              OR: [
                { userName: { contains: search, mode: "insensitive" } },
                { details: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Obter categorias distintas para estoque
  const distinctCategories = await prisma.product.findMany({
    where: { deleted: false },
    select: { category: true },
    distinct: ["category"],
  });

  // Preparar lista de contatos para botão "Copiar Nome + Telefone"
  const contactsForCopy =
    activeTab === "funcionarios"
      ? employeesData.map((e) => ({
          name: e.user?.name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || "Sem Nome",
          phone: e.phone || "",
          role: e.roleTitle || "",
        }))
      : activeTab === "clientes"
      ? clientsData.map((c) => ({
          name: c.companyName,
          phone: c.cellphone || c.phone || c.managerContact || "",
          role: c.managerName ? `Resp: ${c.managerName}` : "",
        }))
      : [];

  const hasActiveFilters = Boolean(
    search || status || category || type || roleFilter || clientIdFilter || fieldsMode !== "completo"
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <FileSpreadsheet size={28} color="#003366" />
            Central de Relatórios e Extração de Dados
          </h1>
          <p className={styles.subtitle}>
            Filtre por categoria/cargo (ex: ASG), extraia listas de nome e telefone, acione o WhatsApp direto ou exporte planilhas.
          </p>
        </div>
      </div>

      {/* Navegação entre Categorias (Abas) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "2px solid #eef2f6",
          paddingBottom: "12px",
        }}
      >
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
              color: activeTab === "funcionarios" ? "white" : "#475569",
            }}
          >
            <Users size={16} /> Funcionários
          </Link>
        )}

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
              color: activeTab === "clientes" ? "white" : "#475569",
            }}
          >
            <Building2 size={16} /> Clientes
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
              color: activeTab === "estoque" ? "white" : "#475569",
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
              color: activeTab === "financeiro" ? "white" : "#475569",
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
              color: activeTab === "auditoria" ? "white" : "#475569",
            }}
          >
            <ShieldAlert size={16} /> Auditoria (Logs)
          </Link>
        )}
      </div>

      {/* Atalhos Rápidos de Categoria / Cargo na aba Funcionários */}
      {activeTab === "funcionarios" && availableRoles.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            background: "#f8fafc",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginRight: "4px",
            }}
          >
            <Briefcase size={15} color="#003366" />
            Filtro Rápido por Categoria / Cargo:
          </span>

          <Link
            href={`/relatorios?tab=funcionarios&status=${encodeURIComponent(status)}&fields=${encodeURIComponent(fieldsMode)}`}
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
              background: !roleFilter ? "#003366" : "white",
              color: !roleFilter ? "white" : "#475569",
              border: "1px solid #cbd5e1",
            }}
          >
            Todas ({availableRoles.length})
          </Link>

          {availableRoles.map((roleName) => {
            const isSelected = roleFilter.toLowerCase() === roleName.toLowerCase();
            return (
              <Link
                key={roleName}
                href={`/relatorios?tab=funcionarios&role=${encodeURIComponent(roleName)}&status=${encodeURIComponent(status)}&fields=${encodeURIComponent(fieldsMode)}`}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  background: isSelected ? "#0284c7" : "white",
                  color: isSelected ? "white" : "#1e293b",
                  border: `1px solid ${isSelected ? "#0284c7" : "#cbd5e1"}`,
                }}
              >
                {roleName}
              </Link>
            );
          })}
        </div>
      )}

      {/* Painel de Filtros */}
      <div className={styles.card} style={{ padding: "20px", marginBottom: "24px" }}>
        <form
          method="GET"
          action="/relatorios"
          style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "14px" }}
        >
          <input type="hidden" name="tab" value={activeTab} />

          <div style={{ flex: 2, minWidth: "220px" }}>
            <label
              htmlFor="search"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "6px",
              }}
            >
              Pesquisar por Nome, Telefone, CPF ou Cargo
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search}
                placeholder={
                  activeTab === "funcionarios"
                    ? "Ex: Maria, ASG, (21) 99999..."
                    : "Digite para filtrar..."
                }
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 36px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          {/* Filtros específicos por Aba */}
          {activeTab === "funcionarios" && (
            <>
              <div style={{ minWidth: "180px", flex: 1 }}>
                <label
                  htmlFor="role"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Categoria / Cargo
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={roleFilter}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "white",
                  }}
                >
                  <option value="">Todas as Categorias</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: "150px" }}>
                <label
                  htmlFor="status"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Status Contratual
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "white",
                  }}
                >
                  <option value="">Todos os Status</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Negado">Negado</option>
                </select>
              </div>

              <div style={{ minWidth: "180px", flex: 1 }}>
                <label
                  htmlFor="clientId"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Cliente / Alocação
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  defaultValue={clientIdFilter}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "white",
                  }}
                >
                  <option value="">Todos os Clientes</option>
                  {availableClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: "210px" }}>
                <label
                  htmlFor="fields"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Modo de Exibição / Extração
                </label>
                <select
                  id="fields"
                  name="fields"
                  defaultValue={fieldsMode}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "white",
                  }}
                >
                  <option value="completo">Relatório Completo</option>
                  <option value="contatos">Apenas Nome, Cargo e Telefone</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "estoque" && (
            <div style={{ minWidth: "150px" }}>
              <label
                htmlFor="category"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                Categoria
              </label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  background: "white",
                }}
              >
                <option value="">Todas</option>
                {distinctCategories.map((c) => (
                  <option key={c.category || ""} value={c.category || ""}>
                    {c.category || "Sem Categoria"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "financeiro" && (
            <>
              <div style={{ minWidth: "150px" }}>
                <label
                  htmlFor="type"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Tipo
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={type}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "white",
                  }}
                >
                  <option value="">Receitas e Despesas</option>
                  <option value="RECEITA">Apenas Receitas</option>
                  <option value="DESPESA">Apenas Despesas</option>
                </select>
              </div>

              <div style={{ minWidth: "150px" }}>
                <label
                  htmlFor="status"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  Situação
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    background: "white",
                  }}
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
              <label
                htmlFor="status"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                Ação
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  background: "white",
                }}
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

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#003366",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Filter size={16} /> Aplicar Filtros
            </button>

            {hasActiveFilters && (
              <Link
                href={`/relatorios?tab=${activeTab}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <XCircle size={15} /> Limpar
              </Link>
            )}

            <a
              href={`/api/reports/${
                activeTab === "auditoria" ? "auditoria" : activeTab
              }/export?search=${encodeURIComponent(search)}&status=${encodeURIComponent(
                status
              )}&category=${encodeURIComponent(category)}&type=${encodeURIComponent(
                type
              )}&role=${encodeURIComponent(roleFilter)}&clientId=${encodeURIComponent(
                clientIdFilter
              )}&fields=${encodeURIComponent(fieldsMode)}`}
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
                textDecoration: "none",
              }}
            >
              <Download size={16} /> Exportar Planilha (.csv)
            </a>

            <ReportActionsClient
              contacts={contactsForCopy}
              showCopyContacts={activeTab === "funcionarios" || activeTab === "clientes"}
            />
          </div>
        </form>
      </div>

      {/* Pré-visualização da Tabela */}
      <div className={styles.card}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <strong style={{ color: "#003366", fontSize: "0.98rem" }}>
              Resultados Encontrados
              {activeTab === "clientes" && ` (${clientsData.length} clientes)`}
              {activeTab === "funcionarios" && ` (${employeesData.length} funcionários)`}
              {activeTab === "estoque" && ` (${productsData.length} itens)`}
              {activeTab === "financeiro" && ` (${financialData.length} lançamentos)`}
              {activeTab === "auditoria" && ` (${auditoriaData.length} registros)`}
            </strong>
            {activeTab === "funcionarios" && roleFilter && (
              <span
                style={{
                  marginLeft: "10px",
                  background: "#e0f2fe",
                  color: "#0369a1",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                Categoria: {roleFilter}
              </span>
            )}
          </div>
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
                <th>Telefone / WhatsApp</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {clientsData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>
                    Nenhum cliente atende aos filtros de pesquisa.
                  </td>
                </tr>
              ) : (
                clientsData.map((c) => {
                  const contactPhone = c.cellphone || c.phone || c.managerContact;
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link
                          href={`/clientes/${c.id}`}
                          style={{ color: "#003366", fontWeight: 700, textDecoration: "none" }}
                        >
                          {c.companyName}
                        </Link>
                      </td>
                      <td>
                        <code>{c.cnpj}</code>
                      </td>
                      <td>{c.name || "-"}</td>
                      <td>
                        {c.city || "-"}/{c.state || "-"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span>{contactPhone || "Não informado"}</span>
                          {contactPhone && (
                            <WhatsAppButton phone={contactPhone} name={c.companyName} size="sm" />
                          )}
                        </div>
                      </td>
                      <td>{c.managerName || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === "funcionarios" && (
          <table className={styles.table}>
            <thead>
              {fieldsMode === "contatos" ? (
                <tr>
                  <th>Nome do Funcionário</th>
                  <th>Categoria / Cargo</th>
                  <th>Telefone Cadastrado</th>
                  <th>Contato Rápido WhatsApp</th>
                  <th>Posto / Cliente</th>
                  <th>Status</th>
                </tr>
              ) : (
                <tr>
                  <th>Colaborador</th>
                  <th>Categoria / Cargo</th>
                  <th>Telefone / WhatsApp</th>
                  <th>CPF</th>
                  <th>Salário</th>
                  <th>Posto Atual</th>
                  <th>Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {employeesData.length === 0 ? (
                <tr>
                  <td
                    colSpan={fieldsMode === "contatos" ? 6 : 7}
                    style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "24px" }}
                  >
                    Nenhum funcionário atende aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                employeesData.map((e) => {
                  const fullName =
                    e.user?.name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || "Sem Nome";

                  if (fieldsMode === "contatos") {
                    return (
                      <tr key={e.id}>
                        <td>
                          <Link
                            href={`/funcionarios/${e.id}`}
                            style={{ color: "#003366", fontWeight: 700, textDecoration: "none" }}
                          >
                            {fullName}
                          </Link>
                        </td>
                        <td>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#0f172a",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {e.roleTitle || "Sem Cargo"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: e.phone ? "#1e293b" : "#94a3b8" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Phone size={14} color={e.phone ? "#0284c7" : "#cbd5e1"} />
                            {e.phone || "Não cadastrado"}
                          </div>
                        </td>
                        <td>
                          {e.phone ? (
                            <WhatsAppButton
                              phone={e.phone}
                              name={fullName}
                              label="Chamar no WhatsApp"
                              size="sm"
                            />
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Indisponível</span>
                          )}
                        </td>
                        <td>
                          {e.workplace
                            ? `${e.workplace.name} (${e.workplace.client?.companyName || ""})`
                            : "Não alocado"}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background:
                                e.status === "Ativo" || e.status === "Contrato"
                                  ? "#eefbf4"
                                  : e.status === "Ausente" || e.status === "Em Análise"
                                  ? "#fef5e7"
                                  : "#fdedec",
                              color:
                                e.status === "Ativo" || e.status === "Contrato"
                                  ? "#27ae60"
                                  : e.status === "Ausente" || e.status === "Em Análise"
                                  ? "#f39c12"
                                  : "#e74c3c",
                            }}
                          >
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={e.id}>
                      <td>
                        <Link
                          href={`/funcionarios/${e.id}`}
                          style={{ color: "#003366", fontWeight: 700, textDecoration: "none" }}
                        >
                          {fullName}
                        </Link>
                      </td>
                      <td>
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#0f172a",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          {e.roleTitle}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, color: e.phone ? "#1e293b" : "#94a3b8" }}>
                            {e.phone || "Sem telefone"}
                          </span>
                          {e.phone && (
                            <WhatsAppButton phone={e.phone} name={fullName} size="sm" />
                          )}
                        </div>
                      </td>
                      <td>
                        <code>{e.cpf}</code>
                      </td>
                      <td>R$ {e.salary?.toFixed(2) || "0,00"}</td>
                      <td>
                        {e.workplace
                          ? `${e.workplace.name} (${e.workplace.client?.companyName || ""})`
                          : "Não alocado"}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              e.status === "Ativo" || e.status === "Contrato"
                                ? "#eefbf4"
                                : e.status === "Ausente" || e.status === "Em Análise"
                                ? "#fef5e7"
                                : "#fdedec",
                            color:
                              e.status === "Ativo" || e.status === "Contrato"
                                ? "#27ae60"
                                : e.status === "Ausente" || e.status === "Em Análise"
                                ? "#f39c12"
                                : "#e74c3c",
                          }}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
                  <td colSpan={7} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>
                    Nenhum material atende aos filtros de pesquisa.
                  </td>
                </tr>
              ) : (
                productsData.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      <code>{p.sku}</code>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      {p.size || "-"} ({p.modelType || "Unissex"})
                    </td>
                    <td>
                      {p.quantity} {p.unit}
                    </td>
                    <td>
                      {p.minQuantity} {p.unit}
                    </td>
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
                  <td colSpan={5} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>
                    Nenhum registro de fluxo atende aos filtros de pesquisa.
                  </td>
                </tr>
              ) : (
                financialData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: item.type === "RECEITA" ? "#eefbf4" : "#fdedec",
                          color: item.type === "RECEITA" ? "#27ae60" : "#e74c3c",
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <strong>{item.description}</strong>
                    </td>
                    <td>R$ {item.amount.toFixed(2)}</td>
                    <td>{new Date(item.dueDate).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background:
                            item.status === "PAGO" || item.status === "LIQUIDADO"
                              ? "#eefbf4"
                              : "#fdedec",
                          color:
                            item.status === "PAGO" || item.status === "LIQUIDADO"
                              ? "#27ae60"
                              : "#e74c3c",
                        }}
                      >
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
                  <td colSpan={4} style={{ textAlign: "center", color: "#888", fontStyle: "italic" }}>
                    Nenhum log correspondente aos filtros foi registrado.
                  </td>
                </tr>
              ) : (
                auditoriaData.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                    <td>
                      <code>{log.userName}</code>
                    </td>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td style={{ color: "#555", fontSize: "0.85rem" }}>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
