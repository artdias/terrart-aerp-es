"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { User } from "lucide-react";

export interface BadgeCardProps {
  name: string;
  roleTitle: string;
  department: string;
  badgeCode: string;
  photoUrl?: string | null;
  companyName?: string;
  companyLogoUrl?: string | null;
  clientName?: string | null;
  clientLogoUrl?: string | null;
  side?: "front" | "back" | "both";
  baseUrl?: string;
}

export default function BadgeCard({
  name,
  roleTitle,
  department,
  badgeCode,
  photoUrl,
  companyName = "Elite Soluções Empresariais Ltda.",
  clientName,
  clientLogoUrl,
  side = "front",
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
  }, [badgeCode, baseUrl]);

  // Render da Logo do Cliente (Imagem oficial ou Caixa Amarela padrão)
  // Render da Logo do Cliente (Imagem oficial ou Caixa Amarela padrão)
  const renderClientLogo = (isBack = false) => {
    if (clientLogoUrl) {
      return (
        <div style={{
          background: isBack ? "white" : "#ffe600",
          padding: "3px 6px",
          borderRadius: "4px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          maxHeight: isBack ? "60px" : "46px",
          maxWidth: isBack ? "190px" : "110px",
          boxShadow: isBack ? "0 4px 10px rgba(0,0,0,0.3)" : "none",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <img
            src={clientLogoUrl}
            alt={clientName || "Cliente"}
            style={{
              maxHeight: isBack ? "50px" : "38px",
              maxWidth: "100%",
              objectFit: "contain"
            }}
          />
        </div>
      );
    }

    // Se não tiver imagem uploaded, renderiza o selo amarelo estilizado padrão (estilo UMI SAN)
    const displayName = clientName || "UMI SAN";
    return (
      <div style={{
        background: "#ffe600",
        border: "1.5px solid #001b3a",
        padding: isBack ? "8px 16px" : "2px 4px",
        textAlign: "center",
        color: "#001b3a",
        fontFamily: "'Arial Black', sans-serif",
        display: "inline-block",
        maxWidth: isBack ? "190px" : "110px",
        maxHeight: isBack ? "60px" : "48px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        <div style={{
          fontSize: isBack ? "1.2rem" : "0.58rem",
          fontWeight: 900,
          letterSpacing: "0.3px",
          textTransform: "uppercase",
          lineHeight: 1.05,
          maxHeight: isBack ? "auto" : "24px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word"
        }}>
          {displayName}
        </div>
        <div style={{
          background: "#001b3a",
          color: "#ffffff",
          fontSize: isBack ? "0.55rem" : "0.38rem",
          fontWeight: 700,
          letterSpacing: "0.3px",
          marginTop: "1px",
          padding: "1px 2px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          HIDROGRAFIA E ENGENHARIA
        </div>
      </div>
    );
  };

  const renderFront = () => (
    <div
      className="badge-card-printable front-side"
      style={{
        width: "260px",
        height: "440px",
        background: "#ffffff",
        borderRadius: "20px",
        border: "2px solid #001b3a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box",
        margin: "0 auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact"
      }}
    >
      {/* 1. Cabeçalho Superior Azul Escuro */}
      <div style={{
        background: "#001b3a",
        color: "white",
        padding: "6px 8px",
        position: "relative",
        height: "76px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        {/* Furo do Crachá (Slot Punch) */}
        <div style={{
          width: "38px",
          height: "12px",
          background: "#ffffff",
          borderRadius: "6px",
          position: "absolute",
          top: "5px",
          left: "50%",
          transform: "translateX(-50%)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
          zIndex: 10
        }} />

        {/* Logo ES (Esquerda) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginTop: "10px",
          maxWidth: "110px",
          flexShrink: 0
        }}>
          <img
            src="/logo.png"
            alt="ES Elite Soluções"
            style={{ height: "42px", maxWidth: "100px", objectFit: "contain" }}
            onError={(e) => {
              // Fallback visual se a logo em imagem falhar
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Logo Cliente (Direita) */}
        <div style={{
          marginTop: "10px",
          maxWidth: "115px",
          maxHeight: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          overflow: "hidden",
          flexShrink: 0
        }}>
          {renderClientLogo(false)}
        </div>
      </div>

      {/* 2. Elementos Geométricos de Fundo (Triângulos e Polígonos Azuis) */}
      {/* Canto Superior Esquerdo */}
      <div style={{
        position: "absolute",
        top: "76px",
        left: 0,
        width: 0,
        height: 0,
        borderTop: "65px solid #007acc",
        borderRight: "65px solid transparent",
        zIndex: 1
      }} />
      <div style={{
        position: "absolute",
        top: "76px",
        left: 0,
        width: 0,
        height: 0,
        borderTop: "42px solid #0052cc",
        borderRight: "42px solid transparent",
        zIndex: 2
      }} />

      {/* Canto Inferior Esquerdo */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        borderBottom: "75px solid #007acc",
        borderRight: "75px solid transparent",
        zIndex: 1
      }} />

      {/* Canto Inferior Direito */}
      <div style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        borderBottom: "105px solid #0052cc",
        borderLeft: "105px solid transparent",
        zIndex: 1
      }} />
      <div style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        borderBottom: "75px solid #007acc",
        borderLeft: "75px solid transparent",
        zIndex: 2
      }} />

      {/* 3. Conteúdo Central (Foto, Nome, Cargo, Código, QR Code) */}
      <div style={{
        position: "relative",
        zIndex: 5,
        padding: "10px 14px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        justifyContent: "space-around"
      }}>
        {/* Foto do Colaborador */}
        <div style={{
          width: "110px",
          height: "120px",
          borderRadius: "12px",
          border: "3px solid #001b3a",
          overflow: "hidden",
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
          margin: "4px 0 0"
        }}>
          {photoUrl ? (
            <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={55} color="#94a3b8" />
          )}
        </div>

        {/* Linha Divisória Azul */}
        <div style={{
          width: "110px",
          height: "4px",
          background: "#007acc",
          borderRadius: "2px",
          margin: "6px 0 4px"
        }} />

        {/* Nome */}
        <div>
          <h2 style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "#001b3a",
            margin: 0,
            textTransform: "uppercase",
            lineHeight: 1.1,
            letterSpacing: "0.5px"
          }}>
            {name}
          </h2>
          {/* Cargo */}
          <div style={{
            fontSize: "0.85rem",
            fontWeight: 800,
            color: "#001b3a",
            textTransform: "uppercase",
            marginTop: "2px"
          }}>
            {roleTitle}
          </div>
        </div>

        {/* Nº REGISTRO */}
        <div style={{ marginTop: "4px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, color: "#001b3a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Nº REGISTRO
          </div>
          {/* Pill do Código */}
          <div style={{
            background: "#001b3a",
            color: "white",
            padding: "3px 18px",
            borderRadius: "20px",
            fontSize: "0.95rem",
            fontWeight: 900,
            fontFamily: "monospace",
            letterSpacing: "1px",
            display: "inline-block",
            marginTop: "2px",
            boxShadow: "0 2px 6px rgba(0,27,58,0.3)"
          }}>
            {badgeCode}
          </div>
        </div>

        {/* QR Code & Mensagem */}
        <div style={{ marginTop: "6px", textAlign: "center" }}>
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt={`QR Code ${badgeCode}`} style={{ width: "85px", height: "85px", borderRadius: "4px", border: "1px solid #ddd" }} />
          ) : (
            <div style={{ width: "85px", height: "85px", background: "#eee", borderRadius: "4px" }} />
          )}

          <div style={{
            fontSize: "0.62rem",
            fontWeight: 900,
            color: "#001b3a",
            textTransform: "uppercase",
            marginTop: "2px",
            lineHeight: 1.1,
            letterSpacing: "0.3px"
          }}>
            ACESSE O QR CODE<br />PARA VERIFICAÇÃO
          </div>
        </div>
      </div>
    </div>
  );

  const renderBack = () => (
    <div
      className="badge-card-printable back-side"
      style={{
        width: "260px",
        height: "440px",
        background: "#001b3a",
        color: "white",
        borderRadius: "20px",
        border: "2px solid #001b3a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 14px",
        position: "relative",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box",
        margin: "0 auto",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact"
      }}
    >
      {/* Furo do Crachá (Slot Punch) */}
      <div style={{
        width: "38px",
        height: "12px",
        background: "#ffffff",
        borderRadius: "6px",
        position: "absolute",
        top: "6px",
        left: "50%",
        transform: "translateX(-50%)",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)"
      }} />

      {/* Topo Verso - Logo Principal */}
      <div style={{ marginTop: "18px" }}>
        <img
          src="/logo.png"
          alt="ES Elite Soluções"
          style={{ height: "65px", objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>

      {/* Texto Institucional de Segurança */}
      <div style={{ margin: "16px 10px 8px" }}>
        <h3 style={{
          fontSize: "0.85rem",
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1.3,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          margin: 0
        }}>
          JUNTOS POR UM AMBIENTE MAIS SEGURO E ORGANIZADO.
        </h3>
        
        {/* Linha Divisória */}
        <div style={{
          width: "140px",
          height: "2px",
          background: "rgba(255,255,255,0.3)",
          margin: "12px auto"
        }} />
      </div>

      {/* Logo da Empresa Parceira / Cliente (Amarelo) */}
      <div style={{ margin: "4px 0 16px" }}>
        {renderClientLogo(true)}
      </div>

      {/* Moldura Inferior Decorativa e Aviso Legal */}
      <div style={{
        width: "100%",
        borderTop: "2px solid #007acc",
        paddingTop: "10px",
        position: "relative"
      }}>
        {/* Detalhe de linha angular */}
        <div style={{
          position: "absolute",
          top: "-2px",
          left: "10px",
          width: "30px",
          height: "2px",
          background: "#60a5fa"
        }} />

        <div style={{
          fontSize: "0.72rem",
          fontWeight: 900,
          color: "#ffffff",
          textTransform: "uppercase",
          lineHeight: 1.2,
          letterSpacing: "0.3px",
          padding: "0 6px"
        }}>
          ESTE CRACHÁ É DE USO PESSOAL E INTRANSTRANSFERÍVEL.
        </div>
      </div>
    </div>
  );

  if (side === "back") return renderBack();
  if (side === "both") {
    return (
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        {renderFront()}
        {renderBack()}
      </div>
    );
  }

  return renderFront();
}
