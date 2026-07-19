"use client";

import React, { useState } from "react";
import { createInterviewAction } from "@/actions/recruitmentActions";
import { ClipboardList, X, PlusCircle } from "lucide-react";

interface InterviewModalProps {
  employeeId: string;
}

export default function InterviewModal({ employeeId }: InterviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      await createInterviewAction(formData);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Erro ao registrar entrevista.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão de Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#003366",
          color: "white",
          border: "none",
          padding: "10px 18px",
          borderRadius: "6px",
          fontSize: "0.85rem",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#002244"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#003366"}
      >
        <PlusCircle size={16} />
        Registrar Entrevista
      </button>

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            width: "600px",
            maxWidth: "90%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            padding: "24px",
            position: "relative",
            animation: "modalFadeIn 0.3s ease-out"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ClipboardList size={22} color="#003366" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#002244", margin: 0 }}>Iniciar Entrevista do Candidato</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: "#fdedec", color: "#c0392b", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "16px", fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="hidden" name="employeeId" value={employeeId} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>ENTREVISTADOR <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input 
                    type="text" 
                    name="interviewer" 
                    required 
                    placeholder="Nome do entrevistador ou RH"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>DATA DA ENTREVISTA <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input 
                    type="datetime-local" 
                    name="interviewDate" 
                    defaultValue={new Date().toISOString().substring(0, 16)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>DECISÃO / STATUS DO CADASTRO <span style={{ color: '#e74c3c' }}>*</span></label>
                <select 
                  name="status" 
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem", boxSizing: "border-box", background: "white" }}
                >
                  <option value="Em Análise">Em Análise (Pendente)</option>
                  <option value="Contrato">Contrato (Contratado / Aprovado)</option>
                  <option value="Negado">Negado (Reprovado)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>PONTOS DA ENTREVISTA * (Qualificações, Destaques, Alertas)</label>
                <textarea 
                  name="points" 
                  required
                  rows={3}
                  placeholder="Ex: Domina bem a área operacional, boa comunicação, CNH regularizada."
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>RELATÓRIO / RESUMO DA CONVERSA <span style={{ color: '#e74c3c' }}>*</span></label>
                <textarea 
                  name="summary" 
                  required
                  rows={4}
                  placeholder="Descreva detalhadamente o que foi falado..."
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "end", gap: "10px", borderTop: "1px solid #eee", paddingTop: "16px", marginTop: "8px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  style={{ background: "#eee", color: "#333", border: "none", padding: "10px 18px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    background: "#27ae60",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(39, 174, 96, 0.2)"
                  }}
                >
                  {loading ? "Registrando..." : "Salvar Entrevista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

