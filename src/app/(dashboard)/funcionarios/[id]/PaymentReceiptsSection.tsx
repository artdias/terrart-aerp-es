"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Plus, Trash2, Download, ExternalLink, Receipt, X } from "lucide-react";
import { addEmployeePaymentReceipts, deleteAttachment } from "@/actions/employeeActions";

interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  createdAt?: string | Date;
}

export default function PaymentReceiptsSection({
  employeeId,
  initialReceipts
}: {
  employeeId: string;
  initialReceipts: AttachmentItem[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receipts, setReceipts] = useState<AttachmentItem[]>(initialReceipts);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      e.target.value = "";
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || loading) return;
    setLoading(true);
    try {
      const toBase64 = (f: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });

      const jsonPayload: string[] = [];
      for (const f of selectedFiles) {
        const base64 = await toBase64(f);
        jsonPayload.push(JSON.stringify({ name: f.name, data: base64 }));
      }

      const res = await addEmployeePaymentReceipts(
        employeeId,
        jsonPayload,
        referenceLabel.trim() || undefined
      );

      if (res?.error) {
        alert(res.error);
      } else {
        setSelectedFiles([]);
        setReferenceLabel("");
        setShowUploadBox(false);
        router.refresh();
      }
    } catch (err) {
      alert("Erro ao anexar comprovantes de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este comprovante de pagamento?")) return;
    const res = await deleteAttachment(id);
    if (res.success) {
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } else {
      alert(res.error || "Erro ao excluir comprovante.");
    }
  };

  // Sincronizar quando initialReceipts mudar após refresh
  React.useEffect(() => {
    setReceipts(initialReceipts);
  }, [initialReceipts]);

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
          marginBottom: "12px"
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
          Comprovantes de Pagamento ({receipts.length})
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
          Anexar Comprovante
        </button>
      </div>

      {/* Box de Upload Rápido */}
      {showUploadBox && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "14px"
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#166534",
                marginBottom: "4px"
              }}
            >
              Mês / Identificação do Pagamento (Opcional)
            </label>
            <input
              type="text"
              value={referenceLabel}
              onChange={(e) => setReferenceLabel(e.target.value)}
              placeholder="Ex: Outubro/2026 - Salário, Quinzena, Passagem..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #86efac",
                fontSize: "0.85rem",
                background: "white"
              }}
            />
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
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
              gap: "6px"
            }}
          >
            <Paperclip size={18} style={{ color: "#16a34a" }} />
            <span style={{ fontSize: "0.85rem", color: "#15803d", fontWeight: 600 }}>
              Clique para selecionar um ou mais comprovantes (PDF, PNG, JPG)...
            </span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={handleFilesSelected}
          />

          {selectedFiles.length > 0 && (
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {selectedFiles.map((f, idx) => (
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
                    onClick={() => removeSelectedFile(idx)}
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => {
                setShowUploadBox(false);
                setSelectedFiles([]);
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
              disabled={selectedFiles.length === 0 || loading}
              onClick={handleUpload}
              style={{
                background: selectedFiles.length === 0 ? "#94a3b8" : "#16a34a",
                color: "white",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: selectedFiles.length === 0 || loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Salvando..." : `Salvar (${selectedFiles.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Comprovantes Anexados */}
      {receipts.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#999", fontStyle: "italic", margin: 0 }}>
          Nenhum comprovante de pagamento anexado para este funcionário.
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
                  gap: "10px",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "0.85rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                  <Receipt size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
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
                      <div style={{ fontSize: "0.73rem", color: "#64748b" }}>
                        Anexado em {dateStr}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.78rem",
                      color: "#0284c7",
                      fontWeight: 600,
                      textDecoration: "none",
                      background: "#e0f2fe",
                      padding: "4px 8px",
                      borderRadius: "4px"
                    }}
                  >
                    <ExternalLink size={12} /> Abrir
                  </a>
                  <a
                    href={r.fileUrl}
                    download={r.fileName}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.78rem",
                      color: "#15803d",
                      fontWeight: 600,
                      textDecoration: "none",
                      background: "#dcfce7",
                      padding: "4px 8px",
                      borderRadius: "4px"
                    }}
                  >
                    <Download size={12} /> Baixar
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      padding: "4px",
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                    title="Excluir comprovante"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
