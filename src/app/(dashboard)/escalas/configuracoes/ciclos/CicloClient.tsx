"use client";

import { useState } from "react";
import { Trash2, Settings, CheckCircle2, XCircle } from "lucide-react";
import { createShiftPattern, deleteShiftPattern } from "@/actions/scheduleConfigActions";

export default function CicloClient({ initialPatterns }: { initialPatterns: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const [cycleLength, setCycleLength] = useState(2);
  const [cycleConfig, setCycleConfig] = useState<{ dayIndex: number; type: string }[]>([
    { dayIndex: 0, type: "WORK" },
    { dayIndex: 1, type: "OFF" }
  ]);

  function handleLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newLen = parseInt(e.target.value, 10);
    if (isNaN(newLen) || newLen < 1 || newLen > 31) return;
    setCycleLength(newLen);
    
    // Adjust array size
    const newConfig = [];
    for (let i = 0; i < newLen; i++) {
      newConfig.push(cycleConfig[i] || { dayIndex: i, type: "WORK" });
    }
    setCycleConfig(newConfig);
  }

  function handleTypeChange(index: number, newType: string) {
    const updated = [...cycleConfig];
    updated[index].type = newType;
    setCycleConfig(updated);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("cycleConfig", JSON.stringify(cycleConfig));
      await createShiftPattern(formData);
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      setCycleLength(2);
      setCycleConfig([{ dayIndex: 0, type: "WORK" }, { dayIndex: 1, type: "OFF" }]);
    } catch (err: any) {
      setError(err.message || "Erro ao criar ciclo.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Excluir este ciclo pode afetar funcionários configurados com ele. Continuar?")) {
      setIsPending(true);
      try {
        await deleteShiftPattern(id);
      } catch (err: any) {
        alert("Erro ao excluir. Verifique dependências.");
      } finally {
        setIsPending(false);
      }
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
      
      {/* LISATAGEM */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Ciclos Cadastrados</h2>
        
        {initialPatterns.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Nenhum ciclo cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {initialPatterns.map(pattern => (
              <div key={pattern.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '12px', borderRadius: '8px' }}>
                    <Settings size={24} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem', display: 'block' }}>{pattern.name}</strong>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tamanho: {pattern.cycleLength} dias</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '300px' }}>
                  {(pattern.cycleConfig as any[]).map((c, i) => (
                    <div key={i} title={`Dia ${i+1}`} style={{
                      width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: c.type === 'WORK' ? '#dcfce7' : '#fee2e2',
                      color: c.type === 'WORK' ? '#16a34a' : '#ef4444'
                    }}>
                      {c.type === 'WORK' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleDelete(pattern.id)}
                  disabled={isPending}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', marginLeft: 'auto' }}
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
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Novo Ciclo</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Nome (Ex: 12x36, 6x1)</label>
            <input 
              name="name" 
              required 
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Tamanho do Ciclo (Dias)</label>
            <input 
              name="cycleLength" 
              type="number"
              min="1" max="31"
              value={cycleLength}
              onChange={handleLengthChange}
              required 
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Configuração Diária</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {cycleConfig.map((c, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Dia {i + 1}</span>
                  <select 
                    value={c.type} 
                    onChange={(e) => handleTypeChange(i, e.target.value)}
                    style={{ 
                      width: '100%', padding: '4px', fontSize: '0.85rem', borderRadius: '4px', border: 'none',
                      backgroundColor: c.type === 'WORK' ? '#dcfce7' : '#fee2e2',
                      color: c.type === 'WORK' ? '#16a34a' : '#ef4444',
                      fontWeight: 600
                    }}
                  >
                    <option value="WORK">Trabalha</option>
                    <option value="OFF">Folga</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              marginTop: '8px', padding: '10px', backgroundColor: '#0ea5e9', color: 'white', 
              border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' 
            }}
          >
            {isPending ? 'Salvando...' : 'Adicionar Padrão'}
          </button>
        </form>
      </div>
    </div>
  );
}
