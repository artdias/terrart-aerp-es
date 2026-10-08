"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Download, Copy, Printer, X, QrCode as QrIcon, CheckCircle2, User, Eye } from "lucide-react";
import Link from "next/link";

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
  department,
  badgeCode,
  photoUrl
}: BadgeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [validationUrl, setValidationUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generateQR() {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/validar/${encodeURIComponent(badgeCode)}`;
        setValidationUrl(url);

        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 1,
          color: {
            dark: "#001b3a",
            light: "#FFFFFF"
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
      }
    }
    if (badgeCode) {
      generateQR();
    }
  }, [badgeCode]);

  if (!isOpen) return null;

  function handleDownload() {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `qrcode-${badgeCode.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleCopyLink() {
    if (!validationUrl) return;
    navigator.clipboard.writeText(validationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px 16px",
        overflowY: "auto"
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-area, #printable-qr-area * {
            visibility: visible !important;
          }
          #printable-qr-area {
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
          maxWidth: "440px",
          padding: "18px 20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          position: "relative",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          margin: "auto 0"
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          position: "sticky",
          top: 0,
          background: "white",
          zIndex: 10,
          paddingBottom: "6px",
          borderBottom: "1px solid #f1f5f9"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <QrIcon size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#001b3a" }}>
                QR Code de Verificação
              </h2>
              <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                Autenticação permanente do colaborador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            style={{
              background: "#e2e8f0",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#0f172a",
              flexShrink: 0,
              transition: "background 0.2s"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Printable de Apresentação do QR Code */}
        <div
          id="printable-qr-area"
          style={{
            background: "#f8fafc",
            borderRadius: "14px",
            border: "1.5px solid #e2e8f0",
            padding: "14px 16px",
            textAlign: "center",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
            margin: "8px 0 12px"
          }}
        >
          {/* Logo Principal */}
          <div style={{ marginBottom: "10px" }}>
            <img
              src="/logo.png"
              alt="Elite Soluções"
              style={{ maxHeight: "38px", objectFit: "contain", margin: "0 auto" }}
            />
          </div>

          {/* Dados do Colaborador */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #001b3a",
              background: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              {photoUrl ? (
                <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={24} color="#64748b" />
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 900, color: "#001b3a", textTransform: "uppercase", lineHeight: 1.1 }}>
                {name}
              </h3>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginTop: "2px" }}>
                {roleTitle}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Setor: {department}
              </div>
            </div>
          </div>

          {/* Código de Registro Permanente */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              CÓDIGO DE VERIFICAÇÃO PERMANENTE
            </div>
            <div style={{
              display: "inline-block",
              background: "#001b3a",
              color: "#ffffff",
              fontWeight: 900,
              fontFamily: "monospace",
              fontSize: "1.05rem",
              padding: "4px 16px",
              borderRadius: "16px",
              marginTop: "3px",
              letterSpacing: "1px"
            }}>
              {badgeCode}
            </div>
          </div>

          {/* Imagem do QR Code */}
          <div style={{
            background: "white",
            padding: "8px",
            borderRadius: "10px",
            display: "inline-block",
            border: "1px solid #cbd5e1",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`QR Code ${badgeCode}`}
                style={{ width: "150px", height: "150px", display: "block" }}
              />
            ) : (
              <div style={{ width: "150px", height: "150px", background: "#f1f5f9" }} />
            )}
          </div>

          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#001b3a", marginTop: "6px", textTransform: "uppercase" }}>
            Acesse ou escaneie para validação oficial
          </div>
        </div>

        {/* Link de Validação Direct Input */}
        <div style={{
          display: "flex",
          gap: "8px",
          background: "#f1f5f9",
          padding: "6px 10px",
          borderRadius: "8px",
          alignItems: "center",
          marginBottom: "14px"
        }}>
          <input
            type="text"
            readOnly
            value={validationUrl}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              fontSize: "0.75rem",
              color: "#334155",
              fontWeight: 600,
              outline: "none"
            }}
          />
          <button
            onClick={handleCopyLink}
            style={{
              background: copied ? "#16a34a" : "#2563eb",
              color: "white",
              border: "none",
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        {/* Botões de Ação do Modal */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "space-between" }}>
          <Link
            href={type === "employee" ? `/funcionarios/${id}` : `/usuarios`}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Eye size={16} /> Ver Perfil
          </Link>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleDownload}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 6px rgba(22,163,74,0.2)"
              }}
            >
              <Download size={16} /> Baixar QR Code
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: "#001b3a",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 6px rgba(0,27,58,0.2)"
              }}
            >
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
