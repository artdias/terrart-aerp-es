"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { concludeAllocation, cancelAllocation } from "@/actions/allocationActions";

export default function ConcludeOrCancelModal({ 
  allocationId, 
  variant = "default" 
}: { 
  allocationId: string;
  variant?: "default" | "tableBtn";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"SELECT" | "CANCEL">("SELECT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConclude = async () => {
    setLoading(true);
    try {
      await concludeAllocation(allocationId);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Erro ao concluir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setMode("SELECT"); setError(""); }}
        style={variant === "default" ? { 
          display: 'flex', alignItems: 'center', gap: '8px', 
          padding: '0.6rem 1.2rem', background: '#27ae60', 
          border: 'none', cursor: 'pointer', color: 'white', 
          fontWeight: 600, borderRadius: '6px' 
        } : {
          display: 'flex', alignItems: 'center', gap: '6px', 
          padding: '6px 12px', background: '#27ae60', 
          border: 'none', cursor: 'pointer', color: 'white', 
          fontWeight: 600, borderRadius: '6px', fontSize: '0.85rem'
        }}
      >
        <CheckCircle2 size={variant === "default" ? 16 : 14} />
        <span>Encerrar</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            {mode === "SELECT" ? (
              <>
                <h3 style={{ margin: '0 0 16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="#f39c12" /> Encerrar Alocação
                </h3>
                <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Como você deseja encerrar esta alocação? Se ela foi concluída com sucesso, a agenda do funcionário será liberada. Caso tenha havido algum imprevisto, você pode cancelá-la informando o motivo.
                </p>

                {error && <div style={{ color: 'red', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={handleConclude} 
                    disabled={loading}
                    style={{ 
                      padding: '12px', background: '#27ae60', color: 'white', 
                      border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <CheckCircle2 size={18} /> {loading ? "Aguarde..." : "Concluir com Sucesso"}
                  </button>
                  <button 
                    onClick={() => setMode("CANCEL")} 
                    disabled={loading}
                    style={{ 
                      padding: '12px', background: '#e74c3c', color: 'white', 
                      border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <XCircle size={18} /> Cancelar Escala (Informar Motivo)
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    style={{ 
                      padding: '12px', background: 'transparent', color: '#666', 
                      border: '1px solid #ccc', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </>
            ) : (
              <form action={async (formData) => {
                setLoading(true);
                try {
                  await cancelAllocation(allocationId, formData);
                  setIsOpen(false);
                } catch (err: any) {
                  setError(err.message || "Erro ao cancelar");
                } finally {
                  setLoading(false);
                }
              }}>
                <h3 style={{ margin: '0 0 16px', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={20} /> Cancelar Alocação
                </h3>
                <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Por favor, justifique o motivo do cancelamento. Essa informação ficará registrada para auditoria.
                </p>

                {error && <div style={{ color: 'red', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

                <textarea 
                  name="cancellationReason"
                  required
                  placeholder="Descreva o motivo do cancelamento..."
                  style={{
                    width: '100%', minHeight: '100px', padding: '12px',
                    borderRadius: '8px', border: '1px solid #ccc',
                    marginBottom: '16px', fontFamily: 'inherit', resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setMode("SELECT")}
                    disabled={loading}
                    style={{ 
                      flex: 1, padding: '10px', background: 'transparent', color: '#666', 
                      border: '1px solid #ccc', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ 
                      flex: 1, padding: '10px', background: '#e74c3c', color: 'white', 
                      border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {loading ? "Salvando..." : "Confirmar Cancelamento"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
