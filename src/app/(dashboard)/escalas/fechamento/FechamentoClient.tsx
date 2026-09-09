"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeSchedule, reopenSchedule, updateScheduleNotes } from "@/actions/scheduleGeneratorActions";
import { CheckCircle2, AlertCircle, FileText, Lock, Unlock, Save } from "lucide-react";
import Link from "next/link";

export default function FechamentoClient({ 
  currentMonth, 
  schedules,
  workplaces,
  currentWorkplace
}: { 
  currentMonth: string;
  schedules: any[];
  workplaces?: any[];
  currentWorkplace?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  function handleFilterChange(month: string, workplace: string) {
    let url = `/escalas/fechamento?month=${month}`;
    if (workplace) url += `&workplaceId=${workplace}`;
    router.push(url);
  }

  async function handleClose(scheduleId: string) {
    if (!confirm("Deseja encerrar esta escala? Ela será bloqueada para edições.")) return;
    setIsPending(true);
    try {
      await closeSchedule(scheduleId);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao encerrar: " + err.message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleReopen(scheduleId: string) {
    if (!confirm("Deseja reabrir esta escala para edições?")) return;
    setIsPending(true);
    try {
      await reopenSchedule(scheduleId);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao reabrir: " + err.message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleSaveNotes(scheduleId: string) {
    setIsPending(true);
    try {
      await updateScheduleNotes(scheduleId, notesDraft[scheduleId] || "");
      alert("Observações salvas!");
      router.refresh();
    } catch (err: any) {
      alert("Erro ao salvar observações: " + err.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      {/* Barra de Filtro */}
      <div style={{ backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 600 }}>Mês de Competência:</label>
          <input 
            type="month" 
            value={currentMonth} 
            onChange={e => handleFilterChange(e.target.value, currentWorkplace || "")}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 600 }}>Empresa / Posto:</label>
          <select 
            value={currentWorkplace || "ALL"} 
            onChange={e => handleFilterChange(currentMonth, e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }}
          >
            <option value="ALL">Visão Global (Todas as Empresas)</option>
            {workplaces?.map(wp => (
              <option key={wp.id} value={wp.id}>{wp.client.companyName} - {wp.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {schedules.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Nenhuma escala encontrada para este mês.</p>
          </div>
        ) : (
          schedules.map((sch) => {
            const isClosed = sch.status === "ENCERRADA";

            return (
              <div key={sch.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: isClosed ? '1px solid #10b981' : '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                        {sch.name || `Escala ${sch.competencyMonth}`}
                      </h3>
                      {isClosed ? (
                        <span style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} /> ENCERRADA
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Unlock size={12} /> ABERTA PARA EDIÇÃO
                        </span>
                      )}
                    </div>
                    
                    <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.95rem' }}>
                      <strong>Posto/Empresa:</strong> {sch.workplace ? `${sch.workplace.client.companyName} - ${sch.workplace.name}` : 'Visão Global'}
                    </p>

                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#475569' }}>Observações do Fechamento:</label>
                      <textarea 
                        disabled={isClosed}
                        placeholder={isClosed ? "Nenhuma observação." : "Escreva aqui as observações para o financeiro (Ex: Faltas abonadas, alertas de hora extra)..."}
                        defaultValue={sch.closingNotes || ""}
                        onChange={(e) => setNotesDraft({ ...notesDraft, [sch.id]: e.target.value })}
                        style={{ width: '100%', maxWidth: '600px', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                      />
                      {!isClosed && (
                        <button 
                          onClick={() => handleSaveNotes(sch.id)}
                          disabled={isPending}
                          style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <Save size={14} /> Salvar Observação
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                    <Link 
                      href={`/escalas/planejamento/${sch.id}`}
                      style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#334155', textDecoration: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                    >
                      <FileText size={18} /> Abrir Grade
                    </Link>

                    {isClosed ? (
                      <button 
                        onClick={() => handleReopen(sch.id)}
                        disabled={isPending}
                        style={{ padding: '10px 16px', background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                      >
                        <Unlock size={18} /> Reabrir Escala
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleClose(sch.id)}
                        disabled={isPending}
                        style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                      >
                        <Lock size={18} /> Encerrar Definitivo
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
