"use client";

import { useState } from "react";
import { saveEmployeeScheduleConfig } from "@/actions/employeeScheduleActions";

export default function ScheduleConfigForm({ 
  employeeId, 
  currentConfig, 
  patterns, 
  shifts 
}: { 
  employeeId: string;
  currentConfig: any;
  patterns: any[];
  shifts: any[];
}) {
  const [isPending, setIsPending] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setMsg("");
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("employeeId", employeeId);
      await saveEmployeeScheduleConfig(formData);
      setMsg("Configuração salva com sucesso!");
    } catch (err: any) {
      setMsg(err.message || "Erro ao salvar.");
    } finally {
      setIsPending(false);
    }
  }

  // Format anchor date for input type="date"
  let initialDate = "";
  if (currentConfig?.cycleAnchorDate) {
    const d = new Date(currentConfig.cycleAnchorDate);
    initialDate = d.toISOString().split('T')[0];
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
        Defina a regra matemática da escala deste funcionário. O motor gerador usará essas informações para prever a escala mensal automaticamente.
      </p>

      {msg && (
        <div style={{ padding: '10px', background: msg.includes('Erro') ? '#fef2f2' : '#f0fdf4', color: msg.includes('Erro') ? '#ef4444' : '#16a34a', borderRadius: '4px', fontSize: '0.9rem' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
            Padrão de Ciclo (Ex: 12x36)
          </label>
          <select 
            name="shiftPatternId" 
            defaultValue={currentConfig?.shiftPatternId || ""}
            required 
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          >
            <option value="">Selecione...</option>
            {patterns.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.cycleLength} dias)</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
            Turno Padrão (Fixo)
          </label>
          <select 
            name="defaultShiftId" 
            defaultValue={currentConfig?.defaultShiftId || ""}
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          >
            <option value="">Padrão do Posto (Livre)</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
            Data Âncora Base
          </label>
          <input 
            type="date"
            name="cycleAnchorDate"
            defaultValue={initialDate}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Uma data passada ou futura onde o ciclo "inicia".</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
            Posição na Data Âncora
          </label>
          <input 
            type="number"
            name="cycleAnchorPosition"
            defaultValue={currentConfig?.cycleAnchorPosition ?? 0}
            min={0}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Qual dia do ciclo ele estava nessa data? (Geralmente 0).</span>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        style={{ padding: '10px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', width: 'fit-content' }}
      >
        {isPending ? "Salvando..." : "Salvar Configuração"}
      </button>
    </form>
  );
}
