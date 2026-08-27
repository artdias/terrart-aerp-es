"use client";

import { useState } from "react";
import { Trash2, Users, Clock } from "lucide-react";
import { addWorkplaceRequirement, deleteWorkplaceRequirement } from "@/actions/workplaceRequirementsActions";

export default function PostoRequirementClient({ workplace, allShifts }: { workplace: any; allShifts: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const daysOfWeekOptions = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 }
  ];
  const [selectedDays, setSelectedDays] = useState<number[]>([0,1,2,3,4,5,6]);

  function toggleDay(dayValue: number) {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("workplaceId", workplace.id);
      formData.append("daysOfWeek", JSON.stringify(selectedDays));
      
      await addWorkplaceRequirement(formData);
      
      // Reset
      (e.target as HTMLFormElement).reset();
      setSelectedDays([0,1,2,3,4,5,6]);
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar demanda.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(reqId: string) {
    if (confirm("Remover esta demanda?")) {
      setIsPending(true);
      try {
        await deleteWorkplaceRequirement(reqId, workplace.id);
      } catch (err: any) {
        alert("Erro ao excluir.");
      } finally {
        setIsPending(false);
      }
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
      
      {/* LISATAGEM DE DEMANDAS */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Configuração Atual</h2>
        
        {workplace.shiftRequirements.length === 0 ? (
          <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', border: '1px dashed #d1d5db' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>Nenhum turno configurado para este posto ainda.</p>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '8px' }}>Adicione a demanda diária ao lado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workplace.shiftRequirements.map((req: any) => {
              const reqDays = Array.isArray(req.daysOfWeek) ? req.daysOfWeek : [];
              const isAllDays = reqDays.length === 7;

              return (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Users size={20} />
                      <strong style={{ fontSize: '1.2rem', marginTop: '4px' }}>{req.requiredEmployees}</strong>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> {req.shift.name} ({req.shift.startTime} - {req.shift.endTime})
                      </strong>
                      <span style={{ color: '#6b7280', fontSize: '0.9rem', display: 'block', marginTop: '4px' }}>
                        {isAllDays ? "Todos os dias da semana" : `Dias ativos: ${reqDays.map((d:number) => daysOfWeekOptions.find(o => o.value === d)?.label).join(", ")}`}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(req.id)}
                    disabled={isPending}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                    title="Excluir Demanda"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FORMULÁRIO */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Nova Demanda</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Turno Necessário</label>
            <select 
              name="shiftId" 
              required 
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="">Selecione um turno...</option>
              {allShifts.map(shift => (
                <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} às {shift.endTime})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Qtd. de Funcionários por Turno</label>
            <input 
              name="requiredEmployees" 
              type="number"
              min="1"
              defaultValue={1}
              required 
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Dias Aplicáveis</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {daysOfWeekOptions.map(day => {
                const isActive = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    style={{
                      padding: '4px 8px', fontSize: '0.85rem', borderRadius: '16px', border: '1px solid',
                      backgroundColor: isActive ? '#0ea5e9' : 'transparent',
                      color: isActive ? 'white' : '#6b7280',
                      borderColor: isActive ? '#0ea5e9' : '#d1d5db',
                      cursor: 'pointer'
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '6px' }}>
              Deixe todos selecionados se o posto funciona 24/7.
            </span>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              marginTop: '8px', padding: '10px', backgroundColor: '#0ea5e9', color: 'white', 
              border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' 
            }}
          >
            {isPending ? 'Salvando...' : 'Adicionar Demanda'}
          </button>
        </form>
      </div>
    </div>
  );
}
