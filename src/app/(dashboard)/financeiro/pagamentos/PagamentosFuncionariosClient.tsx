"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  FileCheck,
  Plus,
  Search,
  Paperclip,
  Trash2,
  Download,
  ExternalLink,
  Copy,
  Check,
  User,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { addEmployeePaymentAndNotes, deleteAttachment } from "@/actions/employeeActions";

export interface PaymentAttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string; // "PAYMENT_RECEIPT" | "SIGNED_NOTE"
  createdAt: string;
}

export interface EmployeePaymentRow {
  id: string;
  name: string;
  cpf: string;
  roleTitle: string;
  status: string;
  salary: number | null;
  pixKey: string | null;
  clientName: string | null;
  workplaceName: string | null;
  paymentReceipts: PaymentAttachmentItem[];
  signedNotes: PaymentAttachmentItem[];
}

export default function PagamentosFuncionariosClient({
  initialEmployees,
  embedded = false
}: {
  initialEmployees: EmployeePaymentRow[];
  embedded?: boolean;
}) {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeePaymentRow[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [focusMode, setFocusMode] = useState<"BOTH" | "RECEIPT" | "NOTE">("BOTH");
  const [referenceLabel, setReferenceLabel] = useState("");
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [signedNoteFiles, setSignedNoteFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const clientsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.clientName) set.add(e.clientName);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchCpf = emp.cpf.toLowerCase().includes(q);
        const matchRole = emp.roleTitle.toLowerCase().includes(q);
        const matchPix = (emp.pixKey || "").toLowerCase().includes(q);
        if (!matchName && !matchCpf && !matchRole && !matchPix) return false;
      }

      if (clientFilter) {
        if (clientFilter === "__NONE__" && emp.clientName) return false;
        if (clientFilter !== "__NONE__" && emp.clientName !== clientFilter) return false;
      }

      if (statusFilter === "COMPLETE") {
        if (emp.paymentReceipts.length === 0 || emp.signedNotes.length === 0) return false;
      } else if (statusFilter === "MISSING_RECEIPT") {
        if (emp.paymentReceipts.length > 0) return false;
      } else if (statusFilter === "MISSING_NOTE") {
        if (emp.signedNotes.length > 0) return false;
      } else if (statusFilter === "HAS_ANY") {
        if (emp.paymentReceipts.length === 0 && emp.signedNotes.length === 0) return false;
      }

      return true;
    });
  }, [employees, searchTerm, clientFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalReceipts = employees.reduce((acc, e) => acc + e.paymentReceipts.length, 0);
    const totalNotes = employees.reduce((acc, e) => acc + e.signedNotes.length, 0);
    const completeCount = employees.filter(
      (e) => e.paymentReceipts.length > 0 && e.signedNotes.length > 0
    ).length;

    return {
      totalEmployees,
      totalReceipts,
      totalNotes,
      completeCount
    };
  }, [employees]);

  const openAttachModal = (empId?: string, mode: "BOTH" | "RECEIPT" | "NOTE" = "BOTH") => {
    setSelectedEmployeeId(empId || (employees[0]?.id ?? ""));
    setFocusMode(mode);
    setReferenceLabel("");
    setReceiptFiles([]);
    setSignedNoteFiles([]);
    setModalOpen(true);
  };

  const handleCopyPix = (empId: string, pix: string) => {
    navigator.clipboard.writeText(pix);
    setCopiedPixId(empId);
    setTimeout(() => setCopiedPixId(null), 2000);
  };

  const handleReceiptsSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReceiptFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const handleNotesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSignedNoteFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert("Selecione um funcionário.");
      return;
    }
    if (receiptFiles.length === 0 && signedNoteFiles.length === 0) {
      alert("Selecione pelo menos um comprovante de pagamento ou uma nota assinada.");
      return;
    }

    setSubmitting(true);
    try {
      const toBase64 = (f: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });

      const receiptsJson: string[] = [];
      for (const f of receiptFiles) {
        const b64 = await toBase64(f);
        receiptsJson.push(JSON.stringify({ name: f.name, data: b64 }));
      }

      const signedNotesJson: string[] = [];
      for (const f of signedNoteFiles) {
        const b64 = await toBase64(f);
        signedNotesJson.push(JSON.stringify({ name: f.name, data: b64 }));
      }

      const res = await addEmployeePaymentAndNotes({
        employeeId: selectedEmployeeId,
        receiptsJson,
        signedNotesJson,
        descriptionPrefix: referenceLabel.trim() || undefined
      });

      if (!res.success) {
        alert(res.error || "Erro ao salvar anexos.");
      } else {
        if (res.createdItems) {
          const newReceipts = res.createdItems.filter((i) => i.type === "PAYMENT_RECEIPT");
          const newNotes = res.createdItems.filter((i) => i.type === "SIGNED_NOTE");

          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === selectedEmployeeId
                ? {
                    ...emp,
                    paymentReceipts: [...newReceipts, ...emp.paymentReceipts],
                    signedNotes: [...newNotes, ...emp.signedNotes]
                  }
                : emp
            )
          );
        }
        setModalOpen(false);
        setReceiptFiles([]);
        setSignedNoteFiles([]);
        setReferenceLabel("");
        router.refresh();
      }
    } catch (err) {
      alert("Ocorreu um erro ao anexar os arquivos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (empId: string, attachmentId: string, label: string) => {
    if (!confirm(`Deseja realmente excluir "${label}"?`)) return;
    const res = await deleteAttachment(attachmentId);
    if (res.success) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === empId
            ? {
                ...emp,
                paymentReceipts: emp.paymentReceipts.filter((r) => r.id !== attachmentId),
                signedNotes: emp.signedNotes.filter((n) => n.id !== attachmentId)
              }
            : emp
        )
      );
      router.refresh();
    } else {
      alert(res.error || "Erro ao excluir anexo.");
    }
  };

  const selectedEmployeeObj = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  return (
    <div>
      {/* Top Action Header when embedded or standalone */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px"
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#002244", margin: 0 }}>
            Pagamentos de Funcionários — Comprovantes & Notas Assinadas
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#64748b" }}>
            Anexe e consulte os comprovantes de pagamento e as notas assinadas de cada colaborador.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAttachModal(undefined, "BOTH")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)"
          }}
        >
          <Plus size={18} />
          <span>Anexar Comprovante / Nota Assinada</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px"
        }}
      >
        <div
          style={{
            background: "white",
            padding: "16px 18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.82rem", fontWeight: 600 }}>
            <User size={16} color="#003366" /> Funcionários Listados
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#002244", marginTop: "6px" }}>
            {stats.totalEmployees}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px 18px",
            borderRadius: "10px",
            border: "1px solid #bbf7d0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontSize: "0.82rem", fontWeight: 600 }}>
            <Receipt size={16} /> Comprovantes de Pagamento
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#15803d", marginTop: "6px" }}>
            {stats.totalReceipts}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px 18px",
            borderRadius: "10px",
            border: "1px solid #bae6fd"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "0.82rem", fontWeight: 600 }}>
            <FileCheck size={16} /> Notas Assinadas Anexadas
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0369a1", marginTop: "6px" }}>
            {stats.totalNotes}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px 18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>
            <CheckCircle2 size={16} color="#10b981" /> Com Comprovante + Nota
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", marginTop: "6px" }}>
            {stats.completeCount} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>/ {stats.totalEmployees}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          background: "white",
          padding: "16px 20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "380px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8"
              }}
            />
            <input
              type="text"
              placeholder="Buscar funcionário por nome, CPF, cargo ou PIX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.9rem",
              background: "white",
              color: "#1e293b"
            }}
          >
            <option value="">Todas as Empresas / Postos</option>
            {clientsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__NONE__">Sem Empresa Alocada</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.9rem",
              background: "white",
              color: "#1e293b"
            }}
          >
            <option value="">Todos os Status de Anexo</option>
            <option value="COMPLETE">✅ Com Comprovante + Nota Assinada</option>
            <option value="HAS_ANY">📎 Com Algum Anexo</option>
            <option value="MISSING_RECEIPT">⚠️ Sem Comprovante de Pagamento</option>
            <option value="MISSING_NOTE">⚠️ Sem Nota Assinada</option>
          </select>

          {(searchTerm || clientFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setClientFilter("");
                setStatusFilter("");
              }}
              style={{
                background: "#f1f5f9",
                color: "#dc2626",
                border: "1px solid #e2e8f0",
                padding: "9px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
          Exibindo <strong>{filteredEmployees.length}</strong> funcionário(s)
        </div>
      </div>

      {/* Main Table */}
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
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", width: "26%" }}>
                  Funcionário / Dados Bancários
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#15803d", textTransform: "uppercase", width: "31%" }}>
                  Comprovantes de Pagamento
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#0369a1", textTransform: "uppercase", width: "31%" }}>
                  Notas Assinadas
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", textAlign: "right", width: "12%" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    <NoResultsMessage />
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      verticalAlign: "top"
                    }}
                  >
                    {/* Employee Info */}
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <Link
                          href={`/funcionarios/${emp.id}`}
                          style={{
                            fontWeight: 700,
                            fontSize: "1rem",
                            color: "#002244",
                            textDecoration: "none"
                          }}
                        >
                          {emp.name}
                        </Link>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          CPF: <strong>{emp.cpf}</strong> • {emp.roleTitle}
                        </div>

                        {emp.clientName && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.78rem",
                              color: "#0369a1",
                              fontWeight: 600,
                              marginTop: "2px"
                            }}
                          >
                            <Building2 size={13} />
                            {emp.clientName}
                            {emp.workplaceName ? ` (${emp.workplaceName})` : ""}
                          </div>
                        )}

                        <div
                          style={{
                            marginTop: "6px",
                            padding: "8px 10px",
                            background: "#f8fafc",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            fontSize: "0.8rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}
                        >
                          <div>
                            <span style={{ color: "#64748b" }}>Salário Base: </span>
                            <strong style={{ color: "#0f172a" }}>
                              {emp.salary
                                ? emp.salary.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                  })
                                : "Não informado"}
                            </strong>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ color: "#64748b" }}>PIX: </span>
                              <strong style={{ color: "#0f172a" }}>{emp.pixKey || "Não cadastrado"}</strong>
                            </div>
                            {emp.pixKey && (
                              <button
                                type="button"
                                onClick={() => handleCopyPix(emp.id, emp.pixKey!)}
                                title="Copiar Chave PIX"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  background: copiedPixId === emp.id ? "#dcfce7" : "#e2e8f0",
                                  color: copiedPixId === emp.id ? "#15803d" : "#334155",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  flexShrink: 0
                                }}
                              >
                                {copiedPixId === emp.id ? <Check size={11} /> : <Copy size={11} />}
                                {copiedPixId === emp.id ? "Copiado" : "Copiar"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Payment Receipts Column */}
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {emp.paymentReceipts.length === 0 ? (
                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "#94a3b8",
                              fontStyle: "italic",
                              padding: "6px 0"
                            }}
                          >
                            Nenhum comprovante anexado.
                          </div>
                        ) : (
                          emp.paymentReceipts.map((r) => (
                            <AttachmentChip
                              key={r.id}
                              item={r}
                              variant="receipt"
                              onDelete={() => handleDeleteAttachment(emp.id, r.id, r.fileName)}
                            />
                          ))
                        )}

                        <button
                          type="button"
                          onClick={() => openAttachModal(emp.id, "RECEIPT")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            width: "fit-content",
                            background: "#f0fdf4",
                            color: "#15803d",
                            border: "1px dashed #86efac",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <Plus size={13} /> Anexar Comprovante
                        </button>
                      </div>
                    </td>

                    {/* Signed Notes Column */}
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {emp.signedNotes.length === 0 ? (
                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "#94a3b8",
                              fontStyle: "italic",
                              padding: "6px 0"
                            }}
                          >
                            Nenhuma nota assinada anexada.
                          </div>
                        ) : (
                          emp.signedNotes.map((n) => (
                            <AttachmentChip
                              key={n.id}
                              item={n}
                              variant="note"
                              onDelete={() => handleDeleteAttachment(emp.id, n.id, n.fileName)}
                            />
                          ))
                        )}

                        <button
                          type="button"
                          onClick={() => openAttachModal(emp.id, "NOTE")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            width: "fit-content",
                            background: "#f0f9ff",
                            color: "#0369a1",
                            border: "1px dashed #7dd3fc",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <Plus size={13} /> Anexar Nota Assinada
                        </button>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td style={{ padding: "16px", textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => openAttachModal(emp.id, "BOTH")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#003366",
                            color: "white",
                            border: "none",
                            padding: "7px 12px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <Paperclip size={13} />
                          Anexar Ambos
                        </button>

                        <Link
                          href={`/funcionarios/${emp.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <User size={13} />
                          Ver Ficha
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Upload de Comprovante de Pagamento e Nota Assinada */}
      {modalOpen && (
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
          onClick={() => !submitting && setModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#002244" }}>
                  Anexar Comprovantes e Notas Assinadas
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Os arquivos ficarão vinculados ao funcionário no Financeiro e na Ficha do Colaborador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              {/* Seleção de Funcionário */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "6px"
                  }}
                >
                  Funcionário *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.92rem",
                    background: "#f8fafc"
                  }}
                >
                  <option value="">-- Selecione o Funcionário --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — CPF: {emp.cpf} ({emp.roleTitle})
                    </option>
                  ))}
                </select>

                {selectedEmployeeObj && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#475569",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                  >
                    <span>
                      <strong>Cargo:</strong> {selectedEmployeeObj.roleTitle}
                    </span>
                    <span>
                      <strong>PIX:</strong> {selectedEmployeeObj.pixKey || "Não informado"}
                    </span>
                    {selectedEmployeeObj.salary && (
                      <span>
                        <strong>Salário:</strong>{" "}
                        {selectedEmployeeObj.salary.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Identificação / Mês de Referência */}
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "6px"
                  }}
                >
                  Mês / Identificação do Pagamento (Opcional)
                </label>
                <input
                  type="text"
                  value={referenceLabel}
                  onChange={(e) => setReferenceLabel(e.target.value)}
                  placeholder="Ex: Outubro/2026, Plantões Set/Out, Quinzena..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              {/* Bloco 1: Comprovantes de Pagamento */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: focusMode === "RECEIPT" ? "2px solid #16a34a" : "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "16px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    color: "#166534",
                    fontSize: "0.9rem",
                    marginBottom: "8px"
                  }}
                >
                  <Receipt size={17} />
                  1. Comprovante(s) de Pagamento
                </div>

                <div
                  onClick={() => receiptInputRef.current?.click()}
                  style={{
                    padding: "14px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px dashed #22c55e",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Paperclip size={18} style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: "0.85rem", color: "#15803d", fontWeight: 600 }}>
                    Clique para selecionar comprovante(s) de pagamento (PDF, PNG, JPG)
                  </span>
                </div>
                <input
                  type="file"
                  ref={receiptInputRef}
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={handleReceiptsSelected}
                />

                {receiptFiles.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {receiptFiles.map((f, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          background: "white",
                          border: "1px solid #dcfce7",
                          borderRadius: "6px",
                          fontSize: "0.82rem"
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReceiptFiles((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bloco 2: Notas Assinadas */}
              <div
                style={{
                  background: "#f0f9ff",
                  border: focusMode === "NOTE" ? "2px solid #0284c7" : "1px solid #bae6fd",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "20px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    color: "#075985",
                    fontSize: "0.9rem",
                    marginBottom: "8px"
                  }}
                >
                  <FileCheck size={17} />
                  2. Nota(s) Assinada(s) pelo Funcionário
                </div>

                <div
                  onClick={() => noteInputRef.current?.click()}
                  style={{
                    padding: "14px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px dashed #0284c7",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Paperclip size={18} style={{ color: "#0284c7" }} />
                  <span style={{ fontSize: "0.85rem", color: "#0369a1", fontWeight: 600 }}>
                    Clique para selecionar a(s) nota(s) assinada(s) (PDF, PNG, JPG)
                  </span>
                </div>
                <input
                  type="file"
                  ref={noteInputRef}
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={handleNotesSelected}
                />

                {signedNoteFiles.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {signedNoteFiles.map((f, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          background: "white",
                          border: "1px solid #bae6fd",
                          borderRadius: "6px",
                          fontSize: "0.82rem"
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSignedNoteFiles((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: "white",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "9px 16px",
                    borderRadius: "8px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || (receiptFiles.length === 0 && signedNoteFiles.length === 0)}
                  style={{
                    background:
                      submitting || (receiptFiles.length === 0 && signedNoteFiles.length === 0)
                        ? "#94a3b8"
                        : "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "9px 20px",
                    borderRadius: "8px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor:
                      submitting || (receiptFiles.length === 0 && signedNoteFiles.length === 0)
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  {submitting
                    ? "Salvando Anexos..."
                    : `Salvar Anexos (${receiptFiles.length + signedNoteFiles.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentChip({
  item,
  variant,
  onDelete
}: {
  item: PaymentAttachmentItem;
  variant: "receipt" | "note";
  onDelete: () => void;
}) {
  const isReceipt = variant === "receipt";
  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "7px 10px",
        background: isReceipt ? "#f0fdf4" : "#f0f9ff",
        border: isReceipt ? "1px solid #bbf7d0" : "1px solid #bae6fd",
        borderRadius: "6px",
        fontSize: "0.8rem"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
        {isReceipt ? (
          <Receipt size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
        ) : (
          <FileCheck size={14} style={{ color: "#0284c7", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div
            title={item.fileName}
            style={{
              fontWeight: 600,
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {item.fileName}
          </div>
          {dateStr && <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Anexado em {dateStr}</div>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir arquivo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "0.72rem",
            color: "#0284c7",
            fontWeight: 600,
            textDecoration: "none",
            background: "white",
            border: "1px solid #cbd5e1",
            padding: "3px 6px",
            borderRadius: "4px"
          }}
        >
          <ExternalLink size={11} /> Abrir
        </a>
        <a
          href={item.fileUrl}
          download={item.fileName}
          title="Baixar arquivo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontSize: "0.72rem",
            color: "#15803d",
            fontWeight: 600,
            textDecoration: "none",
            background: "white",
            border: "1px solid #cbd5e1",
            padding: "3px 6px",
            borderRadius: "4px"
          }}
        >
          <Download size={11} />
        </a>
        <button
          type="button"
          onClick={onDelete}
          title="Excluir anexo"
          style={{
            background: "none",
            border: "none",
            color: "#dc2626",
            cursor: "pointer",
            padding: "3px",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function NoResultsMessage() {
  return (
    <div>
      <FileText size={36} style={{ color: "#cbd5e1", marginBottom: "8px" }} />
      <div style={{ fontSize: "1rem", fontWeight: 600, color: "#334155" }}>
        Nenhum funcionário encontrado para este filtro.
      </div>
    </div>
  );
}
