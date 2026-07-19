"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "#7f8c8d",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.85rem",
        transition: "background 0.2s"
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "#95a5a6")}
      onMouseOut={(e) => (e.currentTarget.style.background = "#7f8c8d")}
    >
      <Printer size={16} /> Imprimir Termo
    </button>
  );
}
