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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(confirmText)) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} action={action} style={{ display: "inline" }}>
      <input type="hidden" name={name} value={id} />
      <button 
        type="submit" 
        style={{
          background: "#c0392b",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#a93226"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#c0392b"}
      >
        <Trash2 size={14} />
        Excluir
      </button>
    </form>
  );
}
