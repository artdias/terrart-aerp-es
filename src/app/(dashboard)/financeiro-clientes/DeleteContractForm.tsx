"use client";

import React, { useRef } from "react";
import { deleteContract } from "@/actions/billingActions";
import { Trash2 } from "lucide-react";

export default function DeleteContractForm({ contractId }: { contractId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("Tem certeza que deseja excluir este contrato? Todas as faturas associadas também serão apagadas. Esta ação não pode ser desfeita.")) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={async (formData) => { await deleteContract(formData); }} style={{ display: 'inline-block' }}>
      <input type="hidden" name="contractId" value={contractId} />
      <button 
        onClick={handleDelete}
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
        title="Excluir Contrato"
      >
        <Trash2 size={16} /> Excluir
      </button>
    </form>
  );
}
