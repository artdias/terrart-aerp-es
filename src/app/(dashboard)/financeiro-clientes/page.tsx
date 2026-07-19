import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Coins, Calendar, FileText, CheckCircle, Clock, AlertTriangle, FileDown, Briefcase } from "lucide-react";
import styles from "../clientes/clientes.module.css";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import PayBillingForm from "./PayBillingForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Inteligência de Faturamento Automático e Detecção de Atrasos
async function checkAndGenerateBillings() {
  const contracts = await prisma.clientContract.findMany({
    where: { status: "ATIVO" }
  });

  const now = new Date();
  
  for (const contract of contracts) {
    if (contract.recurrence === "NENHUMA") continue;

    const start = new Date(contract.startDate);
    const end = new Date(now);
    
    let current = new Date(start);
    
    // Alinhar o 'current' inicial para o dia de vencimento, se possível
    current.setDate(contract.billingDay || 10);
    if (current < start) {
      current.setMonth(current.getMonth() + 1);
    }
    
    while (current <= end) {
      // Checar se já existe cobrança gerada para essa exata data de vencimento
      const dueDate = new Date(current);
      // Evitar horas, checar só o dia (range do dia)
      const startOfDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59);
      
      const existing = await prisma.clientBilling.findFirst({
        where: {
          contractId: contract.id,
          dueDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      
      if (!existing) {
        // Gerar nova cobrança pendente
        await prisma.clientBilling.create({
          data: {
            contractId: contract.id,
            dueDate,
            amount: contract.value,
            status: "PENDENTE"
          }
        });
      }
      
      // Avançar para o próximo ciclo
      if (contract.recurrence === "MENSAL") {
        current.setMonth(current.getMonth() + 1);
      } else if (contract.recurrence === "ANUAL") {
        current.setFullYear(current.getFullYear() + 1);
      } else if (contract.recurrence === "SEMANAL") {
        current.setDate(current.getDate() + 7);
      } else {
        break; // Nenhuma ou fallback
      }
    }
  }
}

export default async function FinanceiroClientesPage({
  searchParams,
}: {
  searchParams: { tab?: string; search?: string; status?: string; sortBy?: string; order?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFaturamento) {
    redirect("/");
  }

  // 1. Executa a inteligência de faturamento antes de renderizar
  await checkAndGenerateBillings();

  const tab = searchParams?.tab || "mensalidades";
  const search = searchParams?.search || "";
  const status = searchParams?.status || "";
  const sortBy = searchParams?.sortBy || "dueDate";
  const order = searchParams?.order || "desc";

  // 2. Buscar Contratos para aba correspondente ou stats
  const activeContracts = await prisma.clientContract.findMany({
    include: { client: true }
  });

  // 3. Fazer query das mensalidades (Contas a Receber)
  const andConditions: any[] = [];
  if (search) {
    andConditions.push({
      OR: [
        { contract: { title: { contains: search } } },
        { contract: { client: { companyName: { contains: search } } } },
        { contract: { client: { cnpj: { contains: search } } } }
      ]
    });
  }
  if (status) {
    andConditions.push({ status });
  }

  const billings = await prisma.clientBilling.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : {},
    orderBy: {
      [sortBy]: order
    },
    include: {
      contract: {
        include: { client: true }
      }
    }
  });

  // 3.5 Computar status dinâmico (Atrasado)
  const now = new Date();
  const processedBillings = billings.map(b => {
    let currentStatus = b.status;
    if (currentStatus === "PENDENTE" && new Date(b.dueDate) < now) {
      // É considerado atrasado visualmente se a data de vencimento passou
      currentStatus = "ATRASADO";
    }
    return { ...b, computedStatus: currentStatus };
  });

  // 4. Calcular Estatísticas de Receita usando o status computado
  const totalContratado = activeContracts
    .filter((c) => c.status === "ATIVO")
    .reduce((acc, c) => acc + c.value, 0);

  const totalPago = processedBillings
    .filter((b) => b.computedStatus === "PAGO")
    .reduce((acc, b) => acc + b.amount, 0);

  const totalAtrasado = processedBillings
    .filter((b) => b.computedStatus === "ATRASADO")
    .reduce((acc, b) => acc + b.amount, 0);

  const totalPendente = processedBillings
    .filter((b) => b.computedStatus === "PENDENTE")
    .reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Faturamento e Contratos</h1>
          <p className={styles.subtitle}>Acompanhe a receita contratada, as faturas e a adimplência dos clientes.</p>
        </div>
        <Link href="/financeiro-clientes/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Novo Contrato</span>
        </Link>
      </div>

      {/* Estatísticas Rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
        {/* Total Contratado */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
          <div style={{ color: "#777", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <Coins size={16} style={{ color: "#003366" }} /> Receita Recorrente (Mensal)
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#003366" }}>
            {totalContratado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>

        {/* Pago */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
          <div style={{ color: "#777", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle size={16} style={{ color: "#27ae60" }} /> Total Recebido
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#27ae60" }}>
            {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>

        {/* Pendente */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
          <div style={{ color: "#777", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} style={{ color: "#f39c12" }} /> Contas a Receber
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#f39c12" }}>
            {totalPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>

        {/* Atrasado */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
          <div style={{ color: "#777", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={16} style={{ color: "#c0392b" }} /> Valor Atrasado
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#c0392b" }}>
            {totalAtrasado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
        <Link
          href={`/financeiro-clientes?tab=mensalidades&search=${search}`}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: tab === "mensalidades" ? "#003366" : "white",
            color: tab === "mensalidades" ? "white" : "#555",
            border: "1px solid #ddd",
            boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
          }}
        >
          Mensalidades e Contas a Receber
        </Link>
        <Link
          href={`/financeiro-clientes?tab=contratos&search=${search}`}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: tab === "contratos" ? "#003366" : "white",
            color: tab === "contratos" ? "white" : "#555",
            border: "1px solid #ddd",
            boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
          }}
        >
          Contratos Registrados
        </Link>
      </div>

      {tab === "mensalidades" ? (
        <>
          {/* Barra de Filtros Reativa para Mensalidades */}
          <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            alignItems: "center",
            background: "white",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            border: "1px solid #eee"
          }}>
            <SearchInput placeholder="Pesquise por cliente ou contrato..." />

            <FilterSelect
              name="status"
              defaultValue={status}
              options={[
                { value: "", label: "Todos os Status" },
                { value: "PAGO", label: "Pago" },
                { value: "PENDENTE", label: "Pendente" },
                { value: "ATRASADO", label: "Atrasado" }
              ]}
            />

            <FilterSelect
              name="sortBy"
              defaultValue={sortBy}
              options={[
                { value: "dueDate", label: "Ordenar por Vencimento" },
                { value: "amount", label: "Ordenar por Valor" }
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

            {search || status || sortBy !== "dueDate" || order !== "desc" ? (
              <Link href="/financeiro-clientes?tab=mensalidades" style={{ fontSize: "0.85rem", color: "#c0392b", fontWeight: 600, textDecoration: "none" }}>
                Limpar Filtros
              </Link>
            ) : null}
          </div>

          {/* Listagem de Mensalidades */}
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contrato</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Comprovante</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {processedBillings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      Nenhuma mensalidade correspondente encontrada.
                    </td>
                  </tr>
                ) : (
                  processedBillings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className={styles.strongText}>{b.contract.client.companyName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>CNPJ: {b.contract.client.cnpj}</div>
                      </td>
                      <td>{b.contract.title}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={14} style={{ color: "#777" }} />
                          {new Date(b.dueDate).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td className={styles.strongText}>
                        {b.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: b.computedStatus === "PAGO" ? "#e8f8f0" : b.computedStatus === "ATRASADO" ? "#fdedec" : "#fef9e7",
                          color: b.computedStatus === "PAGO" ? "#27ae60" : b.computedStatus === "ATRASADO" ? "#c0392b" : "#f39c12",
                          border: `1px solid ${b.computedStatus === "PAGO" ? "#27ae60" : b.computedStatus === "ATRASADO" ? "#c0392b" : "#f39c12"}`
                        }}>
                          {b.computedStatus === "PAGO" ? "PAGO" : b.computedStatus === "ATRASADO" ? "ATRASADO" : "PENDENTE"}
                        </span>
                      </td>
                      <td>
                        {b.proofFileUrl ? (
                          <a
                            href={b.proofFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2980b9", textDecoration: "none", fontWeight: 600, fontSize: "0.8rem" }}
                          >
                            <FileDown size={14} /> Ver Comprovante
                          </a>
                        ) : (
                          <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "0.8rem" }}>Sem anexo</span>
                        )}
                      </td>
                      <td>
                        {b.computedStatus !== "PAGO" ? (
                          <PayBillingForm billingId={b.id} />
                        ) : (
                          <span style={{ color: "#27ae60", fontSize: "0.8rem", fontWeight: 600 }}>
                            Recebido em: <br/> {b.paidAt ? new Date(b.paidAt).toLocaleDateString("pt-BR") : "--"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Listagem de Contratos */
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Descrição do Contrato</th>
                <th>Valor Mensal</th>
                <th>Vencimento</th>
                <th>Data de Início</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Nenhum contrato cadastrado.
                  </td>
                </tr>
              ) : (
                activeContracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.strongText}>{c.client.companyName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>CNPJ: {c.client.cnpj}</div>
                    </td>
                    <td>{c.title}</td>
                    <td className={styles.strongText}>
                      {c.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td>Dia {c.billingDay}</td>
                    <td>{new Date(c.startDate).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: c.status === "ATIVO" ? "#e8f8f0" : "#f2f4f4",
                        color: c.status === "ATIVO" ? "#27ae60" : "#7f8c8d",
                        border: `1px solid ${c.status === "ATIVO" ? "#27ae60" : "#7f8c8d"}`
                      }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
