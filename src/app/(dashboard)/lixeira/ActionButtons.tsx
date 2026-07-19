"use client";

import React from "react";
import { RotateCcw, Trash } from "lucide-react";
import { restoreRecordAction, deleteRecordPermanentlyAction } from "@/actions/trashActions";

export default function ActionButtons({ id, type, name }: { id: string; type: string; name: string }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {/* Formulário de Restauração */}
      <form action={restoreRecordAction} method="POST">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="type" value={type} />
        <button 
          type="submit"
          style={{
            background: "#27ae60",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <RotateCcw size={14} />
          Restaurar
        </button>
      </form>

      {/* Formulário de Exclusão Definitiva */}
      <form 
        action={deleteRecordPermanentlyAction} 
        method="POST"
        onSubmit={(e) => {
          if (!confirm(`ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE o registro '${name}'? Esta ação é irreversível e apagará todos os dados históricos associados do banco.`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="type" value={type} />
        <button 
          type="submit"
          style={{
            background: "#c0392b",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <Trash size={14} />
          Excluir Definitivamente
        </button>
      </form>
    </div>
  );
}
