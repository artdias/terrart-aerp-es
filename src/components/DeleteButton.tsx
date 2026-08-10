"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<any>;
  id: string;
  name: string;
  confirmText: string;
}

export default function DeleteButton({ action, id, name, confirmText }: DeleteButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!window.confirm(confirmText)) return;
    
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
      
      // Se a action retornar um objeto com erro explícito
      if (result && result.error) {
        alert(result.error);
      }
    } catch (error: any) {
      alert("Ocorreu um erro inesperado ao tentar excluir o registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "inline" }}>
      <input type="hidden" name={name} value={id} />
      <button 
        type="submit" 
        style={{
          background: loading ? "#95a5a6" : "#c0392b",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = "#a93226" }}
        onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = "#c0392b" }}
        disabled={loading}
      >
        <Trash2 size={14} />
        {loading ? "Excluindo..." : "Excluir"}
      </button>
    </form>
  );
}
