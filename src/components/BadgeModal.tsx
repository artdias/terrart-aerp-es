"use client";

import React, { useState, useEffect } from "react";
import BadgeCard from "./BadgeCard";
import { Printer, X, Edit3, Check, RefreshCw, Layout, Building2 } from "lucide-react";
import { updateBadgeInfo } from "@/actions/badgeActions";

interface ClientOption {
  id: string;
  companyName: string;
  name?: string | null;
  logoUrl?: string | null;
}

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
  initialClientName?: string | null;
  initialClientLogoUrl?: string | null;
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
  photoUrl,
  initialClientName,
  initialClientLogoUrl
}: BadgeModalProps) {
  const [department, setDepartment] = useState(initialDept);
  const [badgeCode, setBadgeCode] = useState(initialCode);
  const [side, setSide] = useState<"front" | "back" | "both">("both");
  
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientName, setClientName] = useState<string>(initialClientName || "UMI SAN");
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(initialClientLogoUrl || null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Carregar lista de clientes cadastrados no sistema
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (data.success && data.clients) {
          setClients(data.clients);
        }
      } catch (e) {
        console.error("Erro ao carregar clientes:", e);
      }
    }
    loadClients();
  }, []);

  if (!isOpen) return null;

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName(initialClientName || "UMI SAN");
      setClientLogoUrl(initialClientLogoUrl || null);
      return;
    }
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.companyName);
      setClientLogoUrl(found.logoUrl || null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateBadgeInfo(id, type, department, badgeCode);
    setSaving(false);
    if (res.success) {
      setIsEditing(false);
      setMsg({ text: "Informações salvas com sucesso!" });
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
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        overflowY: "auto"
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
          borderRadius: "20px",
          width: "100%",
          maxWidth: side === "both" ? "680px" : "440px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          position: "relative",
          transition: "max-width 0.3s ease"
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#001b3a" }}>
              Crachá Oficial de Identificação
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Layout idêntico ao modelo físico com Frente, Verso e QR Code.
            </p>
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
            marginBottom: "14px",
            fontSize: "0.85rem",
            background: msg.error ? "#fde8e8" : "#eafaf1",
            color: msg.error ? "#e74c3c" : "#27ae60",
            border: `1px solid ${msg.error ? "#f5c6cb" : "#c3e6cb"}`
          }}>
            {msg.text}
          </div>
        )}

        {/* Seletor de Lado (Frente / Verso / Ambos) */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "16px",
          background: "#f1f5f9",
          padding: "4px",
          borderRadius: "10px"
        }}>
          <button
            onClick={() => setSide("front")}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              background: side === "front" ? "#001b3a" : "transparent",
              color: side === "front" ? "white" : "#64748b"
            }}
          >
            Frente
          </button>
          <button
            onClick={() => setSide("back")}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              background: side === "back" ? "#001b3a" : "transparent",
              color: side === "back" ? "white" : "#64748b"
            }}
          >
            Verso
          </button>
          <button
            onClick={() => setSide("both")}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              background: side === "both" ? "#001b3a" : "transparent",
              color: side === "both" ? "white" : "#64748b"
            }}
          >
            Ambos (Imprimir)
          </button>
        </div>

        {/* Área de Visualização e Impressão do Crachá */}
        <div id="printable-badge-area" style={{ margin: "16px 0", display: "flex", justifyContent: "center" }}>
          <BadgeCard
            name={name}
            roleTitle={roleTitle}
            department={department}
            badgeCode={badgeCode}
            photoUrl={photoUrl}
            clientName={clientName}
            clientLogoUrl={clientLogoUrl}
            side={side}
          />
        </div>

        {/* Controles de Seleção de Cliente e Edição */}
        <div style={{
          background: "#f8fafc",
          padding: "12px 14px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginTop: "16px"
        }}>
          <div style={{ marginBottom: isEditing ? "12px" : 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              <Building2 size={16} color="#007acc" /> Logo da Empresa Parceira (Cliente Cadastrado):
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                background: "white",
                fontWeight: 600
              }}
            >
              <option value="">Exibir Padrão (Amarelo - UMI SAN)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} {c.logoUrl ? " (com Logo)" : " (sem Logo)"}
                </option>
              ))}
            </select>
          </div>

          {isEditing && (
            <div style={{ display: "grid", gap: "12px", marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
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
                    placeholder="Ex: TI-0237"
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
                    background: "#001b3a",
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
          )}
        </div>

        {/* Botões do Rodapé */}
        {!isEditing && (
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
              <Edit3 size={18} /> Editar Setor/Código
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: "#001b3a",
                color: "white",
                border: "none",
                padding: "10px 22px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0,27,58,0.25)"
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
