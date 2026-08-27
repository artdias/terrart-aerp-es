"use client";

import { useState } from "react";
import { Plus, Play, Trash2, Calendar, FileText } from "lucide-react";
import { createSchedule, deleteSchedule, generateScheduleDraft } from "@/actions/scheduleGeneratorActions";
import Link from "next/link";

export default function PlanejamentoClient({ initialSchedules }: { initialSchedules: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      await createSchedule(formData);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || "Erro ao criar.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleGenerate(id: string) {
    if (confirm("Gerar a escala vai preencher automaticamente os dias do mês baseado nos Padrões de Ciclo dos funcionários ativos. Continuar?")) {
      setIsPending(true);
      try {
        await generateScheduleDraft(id);
        alert("Escala gerada com sucesso!");
      } catch (err: any) {
        alert(err.message || "Erro ao gerar escala.");
      } finally {
        setIsPending(false);
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Isso apagará toda a escala deste mês e os plantões associados. Continuar?")) {
      setIsPending(true);
      try {
        await deleteSchedule(id);
      } catch (err: any) {
        alert("Erro ao excluir.");
      } finally {
        setIsPending(false);
      }
    }
  }

  const statusColors: any = {
    RASCUNHO: { bg: '#f1f5f9', color: '#64748b' },
    GERADA: { bg: '#e0f2fe', color: '#0284c7' },
    EM_REVISAO: { bg: '#fef3c7', color: '#d97706' },
    PUBLICADA: { bg: '#dcfce7', color: '#16a34a' },
    ENCERRADA: { bg: '#f3f4f6', color: '#374151' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* FORM CRIAR NOVO MES */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 16px 0' }}>Abrir Nova Escala Mensal</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Mês de Competência</label>
            <input 
              name="competencyMonth" 
              type="month"
              required 
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Nome (Opcional)</label>
            <input 
              name="name" 
              placeholder="Ex: Escala Geral Agosto"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              padding: '10px 20px', backgroundColor: '#0284c7', color: 'white', 
              border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Plus size={18} /> Criar Rascunho
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '12px' }}>{error}</p>}
      </div>

      {/* LISTAGEM DE MESES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {initialSchedules.map(sch => {
          const sColor = statusColors[sch.status] || statusColors.RASCUNHO;
          return (
            <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9', padding: '16px', borderRadius: '8px' }}>
                  <Calendar size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', fontWeight: 600 }}>{sch.name}</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Competência: {sch.competencyMonth}</span>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px',
                      backgroundColor: sColor.bg, color: sColor.color
                    }}>
                      {sch.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {sch.status === "RASCUNHO" ? (
                  <button 
                    onClick={() => handleGenerate(sch.id)}
                    disabled={isPending}
                    style={{ 
                      padding: '8px 16px', backgroundColor: '#10b981', color: 'white', 
                      border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <Play size={18} /> Rodar Motor (Gerar)
                  </button>
                ) : (
                  <Link
                    href={`/escalas/planejamento/${sch.id}`}
                    style={{ 
                      padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', textDecoration: 'none',
                      border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <FileText size={18} /> Visualizar Grade
                  </Link>
                )}
                
                <button 
                  onClick={() => handleDelete(sch.id)}
                  disabled={isPending}
                  style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', padding: '8px 12px' }}
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
