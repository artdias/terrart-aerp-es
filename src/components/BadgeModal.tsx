"use client";

import React, { useState } from "react";
import BadgeCard, { BadgeCardProps } from "./BadgeCard";
import { Printer, X, Edit3, Check, RefreshCw } from "lucide-react";
import { updateBadgeInfo } from "@/actions/badgeActions";

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  type: "employee" | "user";
  name: string;
  roleTitle: string;
  department: string;
  badgeCode: string;
  photoUrl?: string | null;
}

export default function BadgeModal({
  isOpen,
  onClose,
  id,
  type,
  name,
  roleTitle,
  department: initialDept,
  badgeCode: initialCode,
  photoUrl
}: BadgeModalProps) {
  const [department, setDepartment] = useState(initialDept);
  const [badgeCode, setBadgeCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateBadgeInfo(id, type, department, badgeCode);
    setSaving(false);
    if (res.success) {
      setIsEditing(false);
      setMsg({ text: "Crachá atualizado com sucesso!" });
    } else {
      setMsg({ text: res.error || "Erro ao salvar", error: true });
    }
  }

  async function handleAutoGenerate() {
    try {
      const res = await fetch(`/api/badge-code/generate?department=${encodeURIComponent(department)}`);
      const data = await res.json();
      if (data.success && data.code) {
        setBadgeCode(data.code);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-badge-area, #printable-badge-area * {
            visibility: visible !important;
          }
          #printable-badge-area {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          position: "relative"
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#002244" }}>Visualização do Crachá</h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#666" }}>Crachá oficial pronto para impressão ou leitura por QR Code.</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notificação */}
        {msg && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.85rem",
            background: msg.error ? "#fde8e8" : "#eafaf1",
            color: msg.error ? "#e74c3c" : "#27ae60",
            border: `1px solid ${msg.error ? "#f5c6cb" : "#c3e6cb"}`
          }}>
            {msg.text}
          </div>
        )}

        {/* Área do Crachá para Exibição e Impressão */}
        <div id="printable-badge-area" style={{ margin: "16px 0", display: "flex", justifyContent: "center" }}>
          <BadgeCard
            name={name}
            roleTitle={roleTitle}
            department={department}
            badgeCode={badgeCode}
            photoUrl={photoUrl}
          />
        </div>

        {/* Painel de Edição de Setor / Código */}
        {isEditing ? (
          <div style={{
            background: "#f8fafc",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            marginTop: "16px",
            display: "grid",
            gap: "12px"
          }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Setor / Departamento
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: TI, RH, Financeiro, Operacional"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Código de Referência (Crachá)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={badgeCode}
                  onChange={(e) => setBadgeCode(e.target.value.toUpperCase())}
                  placeholder="Ex: TI-0001"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontFamily: "monospace",
                    fontWeight: 700
                  }}
                />
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  style={{
                    background: "#e0f2fe",
                    color: "#0369a1",
                    border: "1px solid #bae6fd",
                    padding: "0 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Gerar código baseado no setor"
                >
                  <RefreshCw size={14} /> Gerar
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  background: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Check size={16} /> {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Edit3 size={18} /> Edit Código/Setor
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: "#002244",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Printer size={18} /> Imprimir Crachá
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
