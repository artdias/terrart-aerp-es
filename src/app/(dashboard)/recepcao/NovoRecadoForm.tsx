"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPhoneMessage } from "@/actions/receptionActions";
import { ConciergeBell, ChevronDown } from "lucide-react";

export default function NovoRecadoForm({ users }: { users: any[] }) {
  const [isOther, setIsOther] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, role: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "20px", height: "fit-content", background: "white", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
      <h4 style={{ margin: "0 0 16px 0", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95rem", color: "#002244" }}>
        <ConciergeBell size={16} /> Anotar Novo Recado
      </h4>
      <form action={createPhoneMessage} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }} ref={dropdownRef}>
          <label htmlFor="recipientUserId" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555" }}>
            Para o Colaborador (Destinatário) <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <input type="hidden" name="recipientUserId" value={isOther ? "OUTRO" : (selectedUser?.id || "")} required />
          
          <div 
            style={{ 
              position: "relative", 
              width: "100%", 
              padding: "0.8rem", 
              borderRadius: "8px", 
              border: "1px solid #ddd", 
              background: "#fafafa", 
              fontSize: "0.85rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer"
            }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span style={{ color: selectedUser || isOther ? "#000" : "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isOther ? "Outro (Digitar Nome...)" : selectedUser ? `${selectedUser.name} (${selectedUser.role})` : "-- Selecione o Destinatário --"}
            </span>
            <ChevronDown size={16} color="#777" style={{ flexShrink: 0 }} />
          </div>

          {isOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              maxHeight: "200px",
              overflowY: "auto",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 10
            }}>
              <div style={{ padding: "8px", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "white" }}>
                <input 
                  type="text" 
                  placeholder="Buscar colaborador..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.85rem" }}
                  autoFocus
                />
              </div>
              <div 
                style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}
                onClick={() => { setSelectedUser(null); setIsOther(true); setIsOpen(false); setSearchTerm(""); }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                Outro (Digitar Nome...)
              </div>
              {filteredUsers.map(u => (
                <div 
                  key={u.id}
                  style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}
                  onClick={() => { setSelectedUser(u); setIsOther(false); setIsOpen(false); setSearchTerm(""); }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {u.name} ({u.role})
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div style={{ padding: "10px", fontSize: "0.85rem", color: "#999", textAlign: "center" }}>
                  Nenhum colaborador encontrado.
                </div>
              )}
            </div>
          )}
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
