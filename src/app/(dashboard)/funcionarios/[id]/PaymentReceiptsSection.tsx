"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Plus, Trash2, Download, ExternalLink, Receipt, FileCheck, X } from "lucide-react";
import { addEmployeePaymentAndNotes, deleteAttachment } from "@/actions/employeeActions";

interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  createdAt?: string | Date;
}

export default function PaymentReceiptsSection({
  employeeId,
  initialReceipts,
  initialSignedNotes = []
}: {
  employeeId: string;
  initialReceipts: AttachmentItem[];
  initialSignedNotes?: AttachmentItem[];
}) {
  const router = useRouter();
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  const [receipts, setReceipts] = useState<AttachmentItem[]>(initialReceipts);
  const [signedNotes, setSignedNotes] = useState<AttachmentItem[]>(initialSignedNotes);

  const [selectedReceipts, setSelectedReceipts] = useState<File[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<File[]>([]);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReceiptsSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedReceipts((prev) => [...prev, ...files]);
      e.target.value = "";
    }
  };

  const handleNotesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedNotes((prev) => [...prev, ...files]);
      e.target.value = "";
    }
  };

  const handleUpload = async () => {
    if ((selectedReceipts.length === 0 && selectedNotes.length === 0) || loading) return;
    setLoading(true);
    try {
      const toBase64 = (f: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });

      const receiptsJson: string[] = [];
      for (const f of selectedReceipts) {
        const base64 = await toBase64(f);
        receiptsJson.push(JSON.stringify({ name: f.name, data: base64 }));
      }

      const signedNotesJson: string[] = [];
      for (const f of selectedNotes) {
        const base64 = await toBase64(f);
        signedNotesJson.push(JSON.stringify({ name: f.name, data: base64 }));
      }

      const res = await addEmployeePaymentAndNotes({
        employeeId,
        receiptsJson,
        signedNotesJson,
        descriptionPrefix: referenceLabel.trim() || undefined
      });

      if (res?.error) {
        alert(res.error);
      } else {
        setSelectedReceipts([]);
        setSelectedNotes([]);
        setReferenceLabel("");
        setShowUploadBox(false);
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao anexar comprovantes e notas assinadas.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isNote: boolean) => {
    const label = isNote ? "esta nota assinada" : "este comprovante de pagamento";
    if (!confirm(`Deseja realmente excluir ${label}?`)) return;
    const res = await deleteAttachment(id);
    if (res.success) {
      if (isNote) {
        setSignedNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        setReceipts((prev) => prev.filter((r) => r.id !== id));
      }
      router.refresh();
    } else {
      alert(res.error || "Erro ao excluir anexo.");
    }
  };

  React.useEffect(() => {
    setReceipts(initialReceipts);
  }, [initialReceipts]);

  React.useEffect(() => {
    setSignedNotes(initialSignedNotes);
  }, [initialSignedNotes]);

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "18px",
        borderTop: "1px solid #e2e8f0"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px"
        }}
      >
        <h4
          style={{
            color: "#003366",
            margin: 0,
            fontSize: "0.98rem",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Receipt size={17} style={{ color: "#16a34a" }} />
          Pagamentos — Comprovantes ({receipts.length}) & Notas Assinadas ({signedNotes.length})
        </h4>

        <button
          type="button"
          onClick={() => setShowUploadBox((prev) => !prev)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "#16a34a",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <Plus size={14} />
          Anexar Comprovante / Nota Assinada
        </button>
      </div>

      {/* Box de Upload Rápido */}
      {showUploadBox && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "16px"
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "4px"
              }}
            >
              Mês / Identificação do Pagamento (Opcional)
            </label>
            <input
              type="text"
              value={referenceLabel}
              onChange={(e) => setReferenceLabel(e.target.value)}
              placeholder="Ex: Outubro/2026 - Plantões, Salário, Quinzena..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "white"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Coluna Upload Comprovantes */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "10px"
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
                Comprovante(s) de Pagamento
              </div>
              <div
                onClick={() => receiptInputRef.current?.click()}
                style={{
                  padding: "12px",
                  background: "white",
                  borderRadius: "6px",
                  border: "1px dashed #22c55e",
                  textAlign: "center",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Paperclip size={16} style={{ color: "#16a34a" }} />
                <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 600 }}>
                  Selecionar comprovante...
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

              {selectedReceipts.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {selectedReceipts.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "white",
                        border: "1px solid #dcfce7",
                        borderRadius: "4px",
                        fontSize: "0.78rem"
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipts((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Upload Notas Assinadas */}
            <div
              style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                padding: "10px"
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#075985", marginBottom: "6px" }}>
                Nota(s) Assinada(s)
              </div>
              <div
                onClick={() => noteInputRef.current?.click()}
                style={{
                  padding: "12px",
                  background: "white",
                  borderRadius: "6px",
                  border: "1px dashed #0284c7",
                  textAlign: "center",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Paperclip size={16} style={{ color: "#0284c7" }} />
                <span style={{ fontSize: "0.8rem", color: "#0369a1", fontWeight: 600 }}>
                  Selecionar nota assinada...
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

              {selectedNotes.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {selectedNotes.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "white",
                        border: "1px solid #bae6fd",
                        borderRadius: "4px",
                        fontSize: "0.78rem"
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedNotes((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => {
                setShowUploadBox(false);
                setSelectedReceipts([]);
                setSelectedNotes([]);
              }}
              style={{
                background: "white",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={(selectedReceipts.length === 0 && selectedNotes.length === 0) || loading}
              onClick={handleUpload}
              style={{
                background:
                  selectedReceipts.length === 0 && selectedNotes.length === 0 ? "#94a3b8" : "#16a34a",
                color: "white",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor:
                  (selectedReceipts.length === 0 && selectedNotes.length === 0) || loading
                    ? "not-allowed"
                    : "pointer"
              }}
            >
              {loading
                ? "Salvando..."
                : `Salvar (${selectedReceipts.length + selectedNotes.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Listas Lado a Lado: Comprovantes de Pagamento e Notas Assinadas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Coluna 1: Comprovantes */}
        <div>
          <h5 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", color: "#15803d", display: "flex", alignItems: "center", gap: "5px" }}>
            <Receipt size={15} /> Comprovantes de Pagamento ({receipts.length})
          </h5>
          {receipts.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "#999", fontStyle: "italic", margin: 0 }}>
              Nenhum comprovante anexado.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {receipts.map((r) => {
                const dateStr = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("pt-BR")
                  : null;
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "8px 10px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "6px",
                      fontSize: "0.82rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                      <Receipt size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {r.fileName}
                        </div>
                        {dateStr && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            Anexado em {dateStr}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.75rem",
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
                        href={r.fileUrl}
                        download={r.fileName}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.75rem",
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
                        onClick={() => handleDelete(r.id, false)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          padding: "3px",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                        title="Excluir comprovante"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna 2: Notas Assinadas */}
        <div>
          <h5 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", color: "#0369a1", display: "flex", alignItems: "center", gap: "5px" }}>
            <FileCheck size={15} /> Notas Assinadas ({signedNotes.length})
          </h5>
          {signedNotes.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "#999", fontStyle: "italic", margin: 0 }}>
              Nenhuma nota assinada anexada.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {signedNotes.map((n) => {
                const dateStr = n.createdAt
                  ? new Date(n.createdAt).toLocaleDateString("pt-BR")
                  : null;
                return (
                  <div
                    key={n.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "8px 10px",
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "6px",
                      fontSize: "0.82rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                      <FileCheck size={15} style={{ color: "#0284c7", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {n.fileName}
                        </div>
                        {dateStr && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            Anexado em {dateStr}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <a
                        href={n.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.75rem",
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
                        href={n.fileUrl}
                        download={n.fileName}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.75rem",
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
                        onClick={() => handleDelete(n.id, true)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          padding: "3px",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                        title="Excluir nota assinada"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
