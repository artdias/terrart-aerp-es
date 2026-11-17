"use client";

import React, { useState } from "react";
import { Copy, Check, Printer } from "lucide-react";

interface ContactItem {
  name: string;
  phone: string;
  role?: string;
}

interface ReportActionsClientProps {
  contacts: ContactItem[];
  showCopyContacts?: boolean;
}

export default function ReportActionsClient({
  contacts,
  showCopyContacts = true,
}: ReportActionsClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyContacts = async () => {
    if (!contacts || contacts.length === 0) return;

    const text = contacts
      .map((c) => {
        const rolePart = c.role ? ` [${c.role}]` : "";
        const phonePart = c.phone ? c.phone : "Sem telefone";
        return `${c.name}${rolePart} - ${phonePart}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap" }}>
      {showCopyContacts && contacts.length > 0 && (
        <button
          type="button"
          onClick={handleCopyContacts}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: copied ? "#16a34a" : "#0284c7",
            color: "white",
            border: "none",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "0.88rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          title="Copiar lista de Nome e Telefone dos filtrados"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Lista Copiada!" : "Copiar Nome + Telefone"}
        </button>
      )}

      <button
        type="button"
        onClick={() => window.print()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#334155",
          color: "white",
          border: "none",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "0.88rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
        title="Imprimir ou Salvar em PDF o relatório filtrado"
      >
        <Printer size={16} /> Imprimir / PDF
      </button>
    </div>
  );
}
