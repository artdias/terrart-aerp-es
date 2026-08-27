"use client";

import { useState } from "react";
import { Plus, Trash2, Clock, Moon } from "lucide-react";
import { createShift, deleteShift } from "@/actions/scheduleConfigActions";

export default function TurnoClient({ initialShifts }: { initialShifts: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      await createShift(formData);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || "Erro ao criar turno.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja remover este turno? Isso pode falhar se já houver escalas associadas.")) {
      setIsPending(true);
      try {
        await deleteShift(id);
      } catch (err: any) {
        alert("Erro ao excluir: Provavelmente este turno já está em uso por escalas ou postos.");
      } finally {
        setIsPending(false);
      }
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
      
      {/* LISATAGEM */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Turnos Cadastrados</h2>
        
        {initialShifts.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Nenhum turno cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {initialShifts.map(shift => (
              <div key={shift.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: shift.crossesMidnight ? '#1e1b4b' : '#f0f9ff', color: shift.crossesMidnight ? '#818cf8' : '#0ea5e9', padding: '12px', borderRadius: '8px' }}>
                    {shift.crossesMidnight ? <Moon size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem', display: 'block' }}>{shift.name}</strong>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{shift.startTime} às {shift.endTime}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(shift.id)}
                  disabled={isPending}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORMULÁRIO */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Novo Turno</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Nome do Turno</label>
            <input 
              name="name" 
              required 
              placeholder="Ex: Diurno"
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Entrada</label>
              <input 
                name="startTime" 
                type="time"
                required 
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Saída</label>
              <input 
                name="endTime" 
                type="time"
                required 
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', marginTop: '8px' }}>
            <input type="checkbox" name="crossesMidnight" value="true" />
            Vira a noite (Cruza 00h)
          </label>

          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              marginTop: '8px', padding: '10px', backgroundColor: '#0ea5e9', color: 'white', 
              border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' 
            }}
          >
            {isPending ? 'Salvando...' : 'Adicionar Turno'}
          </button>
        </form>
      </div>
    </div>
  );
}
