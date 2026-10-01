"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { User, Building2 } from "lucide-react";

export interface BadgeCardProps {
  name: string;
  roleTitle: string;
  department: string;
  badgeCode: string;
  photoUrl?: string | null;
  companyName?: string;
  cpf?: string | null;
  baseUrl?: string;
}

export default function BadgeCard({
  name,
  roleTitle,
  department,
  badgeCode,
  photoUrl,
  companyName = "TERRART / ARTLUN",
  baseUrl
}: BadgeCardProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    async function generateQR() {
      try {
        const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
        const validationUrl = `${origin}/validar/${encodeURIComponent(badgeCode)}`;
        
        const dataUrl = await QRCode.toDataURL(validationUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: "#002244",
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
  }, [badgeCode, baseUrl]);

  return (
    <div
      className="badge-card-printable"
      style={{
        width: "250px",
        height: "400px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        border: "2px solid #002244",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box",
        margin: "0 auto",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact"
      }}
    >
      {/* Top Header / Fita Superior */}
      <div style={{
        background: "linear-gradient(135deg, #002244 0%, #1e3a8a 100%)",
        color: "white",
        padding: "12px 10px 8px",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Furo para presilha / cordão */}
        <div style={{
          width: "24px",
          height: "6px",
          background: "#ffffff",
          borderRadius: "3px",
          margin: "0 auto 6px",
          opacity: 0.8
        }} />
        <div style={{
          fontSize: "0.75rem",
          fontWeight: 800,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "#60a5fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px"
        }}>
          <Building2 size={12} />
          {companyName}
        </div>
        <div style={{ fontSize: "0.65rem", opacity: 0.8, letterSpacing: "0.5px" }}>CRACHÁ DE IDENTIFICAÇÃO</div>
      </div>

      {/* Foto do Usuário */}
      <div style={{ textTransform: "none", textAlign: "center", marginTop: "10px" }}>
        <div style={{
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          margin: "0 auto",
          border: "3px solid #3b82f6",
          overflow: "hidden",
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          {photoUrl ? (
            <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={45} color="#94a3b8" />
          )}
        </div>

        {/* Nome do Colaborador */}
        <h3 style={{
          fontSize: "1.05rem",
          fontWeight: 800,
          color: "#002244",
          margin: "8px 10px 2px",
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {name}
        </h3>

        {/* Cargo */}
        <div style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#2563eb",
          margin: "0 10px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {roleTitle}
        </div>

        {/* Setor */}
        <div style={{
          display: "inline-block",
          marginTop: "4px",
          padding: "2px 8px",
          background: "#e0f2fe",
          color: "#0369a1",
          borderRadius: "10px",
          fontSize: "0.68rem",
          fontWeight: 800,
          textTransform: "uppercase"
        }}>
          {department}
        </div>
      </div>

      {/* QR Code & Código de Referência */}
      <div style={{
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        padding: "8px 10px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px"
      }}>
        {qrCodeDataUrl ? (
          <img src={qrCodeDataUrl} alt={`QR Code ${badgeCode}`} style={{ width: "75px", height: "75px" }} />
        ) : (
          <div style={{ width: "75px", height: "75px", background: "#eee", borderRadius: "4px" }} />
        )}

        <div style={{
          fontFamily: "monospace",
          fontSize: "0.85rem",
          fontWeight: 900,
          color: "#002244",
          letterSpacing: "1px",
          background: "#ffffff",
          padding: "2px 8px",
          borderRadius: "4px",
          border: "1px solid #cbd5e1"
        }}>
          CÓD: {badgeCode}
        </div>
      </div>
    </div>
  );
}
