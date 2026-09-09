"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="hide-on-print"
      style={{ padding: '8px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', display: 'flex', gap: '8px', cursor: 'pointer' }}
    >
      <Printer size={18} /> Imprimir PDF
    </button>
  );
}
