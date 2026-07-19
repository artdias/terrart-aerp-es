"use client";

import React, { useState } from "react";
import { createPhoneMessage } from "@/actions/receptionActions";
import { ConciergeBell } from "lucide-react";

export default function NovoRecadoForm({ users }: { users: any[] }) {
  const [isOther, setIsOther] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsOther(e.target.value === "OUTRO");
  };

  return (
    <div style={{ padding: "20px", height: "fit-content", background: "white", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
      <h4 style={{ margin: "0 0 16px 0", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95rem", color: "#002244" }}>
        <ConciergeBell size={16} /> Anotar Novo Recado
      </h4>
      <form action={createPhoneMessage} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label htmlFor="recipientUserId" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555" }}>
            Para o Colaborador (Destinatário) <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <select 
            id="recipientUserId"
            name="recipientUserId"
            required
            onChange={handleSelectChange}
            style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fafafa", fontSize: "0.85rem" }}
          >
            <option value="">-- Selecione o Destinatário --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
            <option value="OUTRO">Outro (Digitar Nome...)</option>
          </select>
        </div>

        {isOther && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "-4px" }}>
            <label htmlFor="recipientName" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555" }}>
              Nome do Destinatário <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input 
              type="text" 
              id="recipientName"
              name="recipientName"
              placeholder="Ex: Diretor Financeiro, Gerente Comercial"
              required={isOther}
              style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fafafa", fontSize: "0.85rem" }}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label htmlFor="senderName" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555" }}>Nome do Remetente <span style={{ color: '#e74c3c' }}>*</span></label>
          <input 
            type="text" 
            id="senderName"
            name="senderName"
            placeholder="Ex: Sr. Carlos da Google"
            required
            style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fafafa", fontSize: "0.85rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label htmlFor="senderContact" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555" }}>Contato (Telefone / E-mail)</label>
          <input 
            type="text" 
            id="senderContact"
            name="senderContact"
            placeholder="Ex: (11) 98765-4321"
            style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fafafa", fontSize: "0.85rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label htmlFor="message" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555" }}>Conteúdo do Recado <span style={{ color: '#e74c3c' }}>*</span></label>
          <textarea 
            id="message"
            name="message"
            rows={4}
            placeholder="Anotação detalhada do recado..."
            required
            style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fafafa", fontSize: "0.85rem", resize: "vertical" }}
          />
        </div>

        <button type="submit" style={{
          width: "100%",
          padding: "0.8rem",
          background: "#003366",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "0.9rem",
          fontWeight: 700,
          cursor: "pointer",
          marginTop: "0.5rem"
        }}>
          Salvar Recado
        </button>
      </form>
    </div>
  );
}
