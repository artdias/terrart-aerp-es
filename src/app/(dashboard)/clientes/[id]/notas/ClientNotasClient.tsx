"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileUp,
  FileText,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Download,
  ExternalLink,
  Check,
  X,
  Filter
} from "lucide-react";
import {
  createInvoice,
  updateInvoice,
  payInvoice,
  unpayInvoice,
  deleteInvoice
} from "@/actions/financeActions";
import styles from "../../novo/novoCliente.module.css";

interface SerializedInvoice {
  id: string;
  clientId: string;
  description: string | null;
  amount: number;
  dueDate: string; // ISO string
  status: string;
  fileUrl: string | null;
  fileName: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientInfo {
  id: string;
  companyName: string;
  name: string | null;
  cnpj: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function extractCompetencyAndCleanDesc(description: string | null, dueDateIso: string) {
  const raw = description || "";
  const match = raw.match(/^\[Ref:\s*(\d{2})\/(\d{4})\]\s*(.*)$/i);
  if (match) {
    const month = match[1];
    const year = match[2];
    const cleanDesc = match[3] || "Nota Fiscal Importada";
    const monthIdx = parseInt(month, 10) - 1;
    const label =
      monthIdx >= 0 && monthIdx < 12
        ? `${MONTH_NAMES[monthIdx].substring(0, 3)}/${year}`
        : `${month}/${year}`;
    return {
      competencyValue: `${year}-${month}`,
      competencyLabel: label,
      cleanDescription: cleanDesc
    };
  }

  // Fallback: deriva o mês a partir da data de vencimento
  const d = new Date(dueDateIso);
  const year = d.getFullYear();
  const monthNum = d.getMonth() + 1;
  const monthStr = String(monthNum).padStart(2, "0");
  return {
    competencyValue: `${year}-${monthStr}`,
    competencyLabel: `${MONTH_NAMES[d.getMonth()].substring(0, 3)}/${year}`,
    cleanDescription: raw || "Nota Fiscal Importada"
  };
}

function extractPaidDate(cancellationReason: string | null, updatedAtIso: string): string {
  if (cancellationReason && cancellationReason.startsWith("PAID_AT:")) {
    return cancellationReason.replace("PAID_AT:", "").trim();
  }
  return updatedAtIso.split("T")[0];
}

export default function ClientNotasClient({
  client,
  initialInvoices
}: {
  client: ClientInfo;
  initialInvoices: SerializedInvoice[];
}) {
  const router = useRouter();

  const currentYearMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  // Estados de filtro
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Estado do Modal de Importação de Nota do Mês
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Estado do Modal de Edição / Alterar Data de Pagamento
  const [editingNote, setEditingNote] = useState<SerializedInvoice | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Estado do Mini-Modal de Confirmação "Marcar como Pago"
  const [payingNote, setPayingNote] = useState<SerializedInvoice | null>(null);
  const [paidDateInput, setPaidDateInput] = useState<string>(todayStr);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Processar notas com status inteligente de data de pagamento
  const processedNotes = useMemo(() => {
    const todayMidnight = new Date(`${todayStr}T00:00:00`);

    return initialInvoices
      .filter((inv) => inv.status !== "CANCELED")
      .map((inv) => {
        const dueDateStr = inv.dueDate.split("T")[0];
        const dueMidnight = new Date(`${dueDateStr}T00:00:00`);
        const { competencyValue, competencyLabel, cleanDescription } =
          extractCompetencyAndCleanDesc(inv.description, inv.dueDate);

        const isPaid = inv.status === "PAID";
        const paidDateStr = isPaid ? extractPaidDate(inv.cancellationReason, inv.updatedAt) : null;
        const paidMidnight = paidDateStr ? new Date(`${paidDateStr}T00:00:00`) : null;

        const diffDays = Math.floor(
          (todayMidnight.getTime() - dueMidnight.getTime()) / (1000 * 60 * 60 * 24)
        );

        let computedStatus: "PAID" | "OVERDUE" | "DUE_TODAY" | "ON_TIME" = "ON_TIME";
        let paidOnTime = true;

        if (isPaid) {
          computedStatus = "PAID";
          if (paidMidnight && paidMidnight.getTime() > dueMidnight.getTime()) {
            paidOnTime = false;
          }
        } else if (diffDays > 0) {
          computedStatus = "OVERDUE";
        } else if (diffDays === 0) {
          computedStatus = "DUE_TODAY";
        } else {
          computedStatus = "ON_TIME";
        }

        return {
          ...inv,
          dueDateStr,
          competencyValue,
          competencyLabel,
          cleanDescription,
          computedStatus,
          diffDays,
          paidDateStr,
          paidOnTime
        };
      });
  }, [initialInvoices, todayStr]);

  // Filtrar notas
  const filteredNotes = useMemo(() => {
    return processedNotes.filter((n) => {
      if (selectedMonth && n.competencyValue !== selectedMonth) {
        return false;
      }
      if (selectedStatus === "PAID" && n.computedStatus !== "PAID") return false;
      if (selectedStatus === "OVERDUE" && n.computedStatus !== "OVERDUE") return false;
      if (
        selectedStatus === "PENDING" &&
        n.computedStatus !== "ON_TIME" &&
        n.computedStatus !== "DUE_TODAY"
      ) {
        return false;
      }
      return true;
    });
  }, [processedNotes, selectedMonth, selectedStatus]);

  // KPIs
  const stats = useMemo(() => {
    const base = selectedMonth
      ? processedNotes.filter((n) => n.competencyValue === selectedMonth)
      : processedNotes;

    const total = base.reduce((acc, n) => acc + n.amount, 0);
    const paid = base
      .filter((n) => n.computedStatus === "PAID")
      .reduce((acc, n) => acc + n.amount, 0);
    const overdue = base
      .filter((n) => n.computedStatus === "OVERDUE")
      .reduce((acc, n) => acc + n.amount, 0);
    const pendingOnTime = base
      .filter((n) => n.computedStatus === "ON_TIME" || n.computedStatus === "DUE_TODAY")
      .reduce((acc, n) => acc + n.amount, 0);

    return {
      total,
      totalCount: base.length,
      paid,
      paidCount: base.filter((n) => n.computedStatus === "PAID").length,
      overdue,
      overdueCount: base.filter((n) => n.computedStatus === "OVERDUE").length,
      pendingOnTime,
      pendingCount: base.filter(
        (n) => n.computedStatus === "ON_TIME" || n.computedStatus === "DUE_TODAY"
      ).length
    };
  }, [processedNotes, selectedMonth]);

  // Handlers
  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (importLoading) return;
    setImportLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("clientId", client.id);
      const res = await createInvoice(formData);
      if (res?.error) {
        alert(res.error);
      } else {
        setShowImportModal(false);
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao importar nota fiscal.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNote || editLoading) return;
    setEditLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("clientId", client.id);
      const res = await updateInvoice(editingNote.id, formData);
      if (res?.error) {
        alert(res.error);
      } else {
        setEditingNote(null);
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao atualizar nota fiscal.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmPay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingNote) return;
    setActionLoadingId(payingNote.id);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("invoiceId", payingNote.id);
      formData.set("paidAt", paidDateInput);
      const res = await payInvoice(formData);
      if (res?.error) {
        alert(res.error);
      } else {
        setPayingNote(null);
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao marcar nota como paga.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnpay = async (invoiceId: string) => {
    if (!confirm("Deseja desmarcar o pagamento e voltar esta nota para Pendente?")) return;
    setActionLoadingId(invoiceId);
    try {
      const formData = new FormData();
      formData.set("invoiceId", invoiceId);
      const res = await unpayInvoice(formData);
      if (res?.error) alert(res.error);
      else router.refresh();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota importada?")) return;
    setActionLoadingId(invoiceId);
    try {
      const formData = new FormData();
      formData.set("invoiceId", invoiceId);
      const res = await deleteInvoice(formData);
      if (res?.error) alert(res.error);
      else router.refresh();
    } finally {
      setActionLoadingId(null);
    }
  };

  const editingParsed = editingNote
    ? extractCompetencyAndCleanDesc(editingNote.description, editingNote.dueDate)
    : null;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href={`/clientes/${client.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#f0f4f8",
              color: "#003366",
              textDecoration: "none"
            }}
            title="Voltar para o Cliente"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#002244", margin: 0 }}>
                Financeiro de Notas — {client.companyName}
              </h1>
              <span
                style={{
                  background: "#eef2f6",
                  color: "#003366",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 600
                }}
              >
                CNPJ: {client.cnpj}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#64748b" }}>
              Importe as notas fiscais de cada mês, defina a data de pagamento e acompanhe se foram pagas na data.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            href="/clientes"
            style={{
              background: "white",
              color: "#475569",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
              padding: "9px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600
            }}
          >
            Lista de Clientes
          </Link>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#003366",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,51,102,0.18)"
            }}
          >
            <Plus size={18} />
            <span>Importar Nota do Mês</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo (KPIs) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div
          style={{
            background: "white",
            padding: "18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.82rem", fontWeight: 600 }}>
            <FileText size={16} color="#003366" /> Total Importado ({stats.totalCount})
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#002244", marginTop: "6px" }}>
            {stats.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "18px",
            borderRadius: "10px",
            border: "1px solid #bbf7d0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontSize: "0.82rem", fontWeight: 600 }}>
            <CheckCircle2 size={16} /> Notas Pagas ({stats.paidCount})
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#15803d", marginTop: "6px" }}>
            {stats.paid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "18px",
            borderRadius: "10px",
            border: "1px solid #fde68a",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d97706", fontSize: "0.82rem", fontWeight: 600 }}>
            <Clock size={16} /> Aguardando / No Prazo ({stats.pendingCount})
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#b45309", marginTop: "6px" }}>
            {stats.pendingOnTime.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>

        <div
          style={{
            background: stats.overdueCount > 0 ? "#fff5f5" : "white",
            padding: "18px",
            borderRadius: "10px",
            border: stats.overdueCount > 0 ? "1px solid #feb2b2" : "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626", fontSize: "0.82rem", fontWeight: 600 }}>
            <AlertTriangle size={16} /> Não Pago na Data ({stats.overdueCount})
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#b91c1c", marginTop: "6px" }}>
            {stats.overdue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
      </div>

      {/* Barra de Filtros Mensal e por Status */}
      <div
        style={{
          background: "white",
          padding: "16px 20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "end",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "end" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#475569",
                marginBottom: "4px"
              }}
            >
              MÊS DE REFERÊNCIA
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                color: "#1e293b"
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#475569",
                marginBottom: "4px"
              }}
            >
              SITUAÇÃO DO PAGAMENTO
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                background: "white",
                color: "#1e293b",
                minWidth: "220px"
              }}
            >
              <option value="">Todas as Notas</option>
              <option value="OVERDUE">🚨 Não Pago na Data (Em Atraso)</option>
              <option value="PENDING">⏳ Aguardando Pagamento (No Prazo)</option>
              <option value="PAID">✅ Pagas</option>
            </select>
          </div>

          {(selectedMonth || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMonth("");
                setSelectedStatus("");
              }}
              style={{
                background: "#f1f5f9",
                color: "#c0392b",
                border: "1px solid #e2e8f0",
                padding: "9px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Ver Todos os Meses
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
          Exibindo <strong>{filteredNotes.length}</strong> nota(s)
        </div>
      </div>

      {/* Tabela de Notas do Cliente */}
      <div
        style={{
          background: "white",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>
                  Mês Ref.
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>
                  Nota Fiscal / Arquivo Importado
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>
                  Valor (R$)
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>
                  Data de Pagamento
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>
                  Foi Pago na Data? (Status)
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    <FileText size={36} style={{ color: "#cbd5e1", marginBottom: "8px" }} />
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "#334155" }}>
                      Nenhuma nota fiscal encontrada para este filtro.
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                      Clique em <strong>&ldquo;Importar Nota do Mês&rdquo;</strong> no topo para anexar a nota do cliente e definir a data de pagamento.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  const formattedDue = new Date(`${note.dueDateStr}T12:00:00`).toLocaleDateString("pt-BR");
                  const formattedPaid = note.paidDateStr
                    ? new Date(`${note.paidDateStr}T12:00:00`).toLocaleDateString("pt-BR")
                    : null;

                  return (
                    <tr
                      key={note.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background:
                          note.computedStatus === "OVERDUE"
                            ? "#fffafa"
                            : note.computedStatus === "PAID"
                            ? "#fafffc"
                            : "white"
                      }}
                    >
                      {/* Mês Ref */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            background: "#eef2f6",
                            color: "#003366",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.82rem",
                            fontWeight: 700
                          }}
                        >
                          {note.competencyLabel}
                        </span>
                      </td>

                      {/* Nota / Anexo */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.92rem" }}>
                          {note.cleanDescription}
                        </div>
                        {note.fileUrl ? (
                          <div style={{ display: "flex", gap: "10px", marginTop: "6px", alignItems: "center" }}>
                            <a
                              href={note.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.8rem",
                                color: "#0284c7",
                                fontWeight: 600,
                                textDecoration: "none",
                                background: "#e0f2fe",
                                padding: "3px 8px",
                                borderRadius: "4px"
                              }}
                            >
                              <ExternalLink size={12} /> Ver Nota ({note.fileName || "Arquivo"})
                            </a>
                            <a
                              href={note.fileUrl}
                              download={note.fileName || `nota-${note.competencyValue}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.78rem",
                                color: "#475569",
                                fontWeight: 600,
                                textDecoration: "none"
                              }}
                            >
                              <Download size={12} /> Baixar
                            </a>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>
                            Sem arquivo anexado (clique em Editar para anexar)
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <strong style={{ fontSize: "1.02rem", color: "#0f172a" }}>
                          {note.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </strong>
                      </td>

                      {/* Data de Pagamento */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={15} color="#64748b" />
                          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>
                            {formattedDue}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingNote(note)}
                            title="Alterar data de pagamento"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#2563eb",
                              cursor: "pointer",
                              padding: "2px 4px",
                              fontSize: "0.75rem",
                              fontWeight: 600
                            }}
                          >
                            (alterar)
                          </button>
                        </div>
                      </td>

                      {/* Status: Foi pago na data? */}
                      <td style={{ padding: "14px 16px" }}>
                        {note.computedStatus === "PAID" && (
                          <div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #86efac",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 700
                              }}
                            >
                              <CheckCircle2 size={14} />
                              {note.paidOnTime ? "PAGO NA DATA" : "PAGO (COM ATRASO)"}
                            </span>
                            {formattedPaid && (
                              <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "4px" }}>
                                Pago em: <strong>{formattedPaid}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {note.computedStatus === "OVERDUE" && (
                          <div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fca5a5",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 700
                              }}
                            >
                              <AlertTriangle size={14} />
                              NÃO PAGO NA DATA
                            </span>
                            <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 600, marginTop: "4px" }}>
                              Em atraso há {note.diffDays} {note.diffDays === 1 ? "dia" : "dias"}
                            </div>
                          </div>
                        )}

                        {note.computedStatus === "DUE_TODAY" && (
                          <div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#fef3c7",
                                color: "#b45309",
                                border: "1px solid #fcd34d",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 700
                              }}
                            >
                              <Clock size={14} />
                              VENCE HOJE (NÃO PAGO)
                            </span>
                          </div>
                        )}

                        {note.computedStatus === "ON_TIME" && (
                          <div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 700
                              }}
                            >
                              <Clock size={14} />
                              AGUARDANDO (NO PRAZO)
                            </span>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                              Faltam {Math.abs(note.diffDays)} {Math.abs(note.diffDays) === 1 ? "dia" : "dias"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          {note.computedStatus !== "PAID" ? (
                            <button
                              type="button"
                              disabled={actionLoadingId === note.id}
                              onClick={() => {
                                setPaidDateInput(todayStr);
                                setPayingNote(note);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#16a34a",
                                color: "white",
                                border: "none",
                                padding: "7px 12px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              <Check size={14} />
                              Marcar como Pago
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoadingId === note.id}
                              onClick={() => handleUnpay(note.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                              title="Reverter para Não Pago / Pendente"
                            >
                              <RotateCcw size={13} />
                              Desmarcar Pago
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingNote(note)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#f59e0b",
                              color: "white",
                              border: "none",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                            title="Editar Nota ou Data de Pagamento"
                          >
                            <Edit3 size={13} />
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={actionLoadingId === note.id}
                            onClick={() => handleDelete(note.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                            title="Excluir Nota"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* MODAL 1: IMPORTAR NOTA DO MÊS */}
      {showImportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "560px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#002244" }}>
                Importar Nota Fiscal do Mês
              </h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} encType="multipart/form-data">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Mês de Referência <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="month"
                    name="competencyMonth"
                    defaultValue={selectedMonth || currentYearMonth}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Data de Pagamento <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Valor da Nota (R$) <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    placeholder="Ex: 3500.00"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Situação Inicial
                  </label>
                  <select
                    name="status"
                    defaultValue="PENDING"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      background: "white"
                    }}
                  >
                    <option value="PENDING">⏳ Aguardando Pagamento</option>
                    <option value="PAID">✅ Já foi Pago</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Identificação / Número da Nota Fiscal
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Ex: NF-e #1045 - Prestação de Serviços Mensal"
                  maxLength={200}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Arquivo da Nota Fiscal (PDF, XML, Imagem)
                </label>
                <input
                  type="file"
                  name="attachment"
                  accept=".pdf,.xml,.png,.jpg,.jpeg"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px dashed #94a3b8",
                    background: "#f8fafc",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  style={{
                    background: "#003366",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: importLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {importLoading ? "Importando..." : "Salvar e Importar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MARCAR COMO PAGO (CONFIRMAR DATA DE PAGAMENTO) */}
      {payingNote && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "440px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#15803d", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={20} /> Confirmar Pagamento da Nota
              </h3>
              <button
                type="button"
                onClick={() => setPayingNote(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmPay}>
              <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "#475569" }}>
                Informe a data em que o cliente realizou o pagamento para registrar se foi pago na data estipulada.
              </p>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Data em que foi Pago
                </label>
                <input
                  type="date"
                  name="paidAt"
                  value={paidDateInput}
                  onChange={(e) => setPaidDateInput(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setPayingNote(null)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === payingNote.id}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {actionLoadingId === payingNote.id ? "Salvando..." : "Confirmar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR NOTA / DEFINIR DATA DE PAGAMENTO */}
      {editingNote && editingParsed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#002244" }}>
                Editar Nota / Data de Pagamento
              </h2>
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} encType="multipart/form-data">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Mês de Referência <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="month"
                    name="competencyMonth"
                    defaultValue={editingParsed.competencyValue}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Data de Pagamento <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingNote.dueDate.split("T")[0]}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Valor da Nota (R$) <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    defaultValue={editingNote.amount}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Status do Pagamento
                  </label>
                  <select
                    name="status"
                    defaultValue={editingNote.status === "PAID" ? "PAID" : "PENDING"}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      background: "white"
                    }}
                  >
                    <option value="PENDING">⏳ Pendente / Não Pago</option>
                    <option value="PAID">✅ Pago</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Identificação / Descrição da Nota
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingParsed.cleanDescription}
                  maxLength={200}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Substituir / Anexar Arquivo da Nota Fiscal (Opcional)
                </label>
                {editingNote.fileName && (
                  <div style={{ fontSize: "0.8rem", color: "#16a34a", marginBottom: "6px", fontWeight: 600 }}>
                    Arquivo atual: {editingNote.fileName}
                  </div>
                )}
                <input
                  type="file"
                  name="attachment"
                  accept=".pdf,.xml,.png,.jpg,.jpeg"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px dashed #94a3b8",
                    background: "#f8fafc",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    background: "#f59e0b",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: editLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {editLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
