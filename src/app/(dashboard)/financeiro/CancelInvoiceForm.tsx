"use client";

import { cancelInvoice } from "@/actions/financeActions";
import React, { useRef } from "react";

interface CancelInvoiceFormProps {
  invoiceId: string;
}

export default function CancelInvoiceForm({ invoiceId }: CancelInvoiceFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const reason = window.prompt("Por favor, informe o motivo do cancelamento desta fatura:");
    if (reason !== null && reason.trim() !== "") {
      if (reasonRef.current) {
        reasonRef.current.value = reason;
      }
      formRef.current?.requestSubmit();
    } else if (reason !== null) {
      alert("O motivo do cancelamento é obrigatório.");
    }
  };

  return (
    <form ref={formRef} action={async (formData) => { await cancelInvoice(formData); }} style={{ display: 'inline-block' }}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="reason" ref={reasonRef} />
      <button 
        onClick={handleCancelClick}
        type="button"
        style={{ 
          background: '#e74c3c', 
          color: 'white', 
          border: 'none',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s'
        }}
      >
        Cancelar
      </button>
    </form>
  );
}
