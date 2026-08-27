"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerOccurrence, registerCoverage, confirmNormalPresence } from "@/actions/occurrenceActions";
import { UserCheck, UserMinus, AlertTriangle, ShieldAlert, Check } from "lucide-react";

export default function OcorrenciasClient({ 
  currentDate, 
  initialAssignments, 
  activeEmployees 
}: { 
  currentDate: string;
  initialAssignments: any[];
  activeEmployees: any[];
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  
  // Modal de Falta / Cobertura
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/escalas/ocorrencias?date=${e.target.value}`);
  }

  async function handleConfirmPresence(assignmentId: string, employeeId: string) {
    if (confirm("Confirmar presença integral para este plantão?")) {
      setIsPending(true);
      try {
        await confirmNormalPresence(assignmentId, employeeId);
      } catch (err: any) {
        alert(err.message || "Erro.");
      } finally {
        setIsPending(false);
      }
    }
  }

  async function handleOccurrenceForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await registerOccurrence(formData);
      
      const substitute = formData.get("substituteEmployeeId");
      if (substitute) {
        await registerCoverage(formData);
      }

      setActiveModalId(null);
    } catch (err: any) {
      alert(err.message || "Erro ao registrar.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      {/* Barra de Filtro */}
      <div style={{ backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label style={{ fontWeight: 600 }}>Filtrar Plantões por Data:</label>
        <input 
          type="date" 
          value={currentDate} 
          onChange={handleDateChange}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }}
        />
      </div>

      {initialAssignments.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Nenhum plantão planejado (ou gerado) para esta data.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {initialAssignments.map(a => {
            const empName = a.employee.user?.name || a.employee.firstName || "Sem Nome";
            const isConfirmed = a.status === "REALIZADO_INTEGRAL";
            const isFalta = a.status === "FALTA";
            const isCoberto = a.status === "COBERTO";
            
            let cardBg = 'white';
            let statusColor = '#374151';
            
            if (isConfirmed) { cardBg = '#f0fdf4'; statusColor = '#16a34a'; }
            if (isFalta) { cardBg = '#fef2f2'; statusColor = '#ef4444'; }
            if (isCoberto) { cardBg = '#fdf4ff'; statusColor = '#c026d3'; }

            return (
              <div key={a.id} style={{ backgroundColor: cardBg, borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem' }}>{a.workplace.name}</h3>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {a.shift.name} ({a.shift.startTime} - {a.shift.endTime})
                    </span>
                  </div>

                  <div style={{ width: '1px', height: '40px', backgroundColor: '#d1d5db' }}></div>

                  <div>
                    <strong style={{ display: 'block', fontSize: '1.05rem' }}>Titular: {empName}</strong>
                    <span style={{ fontWeight: 600, color: statusColor, fontSize: '0.85rem' }}>
                      Status: {a.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {a.status === "PLANEJADO" && (
                    <>
                      <button 
                        onClick={() => handleConfirmPresence(a.id, a.employeeId)}
                        disabled={isPending}
                        style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <UserCheck size={18} /> Confirmar Presença
                      </button>
                      
                      <button 
                        onClick={() => setActiveModalId(a.id)}
                        disabled={isPending}
                        style={{ padding: '8px 16px', background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <AlertTriangle size={18} /> Registrar Falta / Ocorrência
                      </button>
                    </>
                  )}

                  {isCoberto && a.coverages.length > 0 && (
                    <div style={{ padding: '8px 16px', background: 'white', border: '1px solid #e879f9', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={18} color="#c026d3" />
                      <span style={{ color: '#c026d3', fontWeight: 600 }}>
                        Coberto por: {a.coverages[0].substituteEmployee.user?.name || a.coverages[0].substituteEmployee.firstName}
                      </span>
                    </div>
                  )}

                  {isConfirmed && (
                    <div style={{ padding: '8px 16px', background: 'white', border: '1px solid #4ade80', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 600 }}>
                      <Check size={18} /> Presença Confirmada
                    </div>
                  )}
                </div>

                {/* MODAL DE OCORRÊNCIA (Apenas renderizado quando Ativo) */}
                {activeModalId === a.id && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                      <h2 style={{ margin: '0 0 20px 0' }}>Registrar Ocorrência</h2>
                      <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '20px' }}>
                        Posto: {a.workplace.name} | Titular: {empName}
                      </p>

                      <form onSubmit={handleOccurrenceForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input type="hidden" name="assignmentId" value={a.id} />
                        <input type="hidden" name="employeeId" value={a.employeeId} />
                        <input type="hidden" name="originalEmployeeId" value={a.employeeId} />
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Motivo</label>
                          <select name="type" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                            <option value="">Selecione...</option>
                            <option value="FALTA_INTEGRAL">Falta Integral</option>
                            <option value="ATESTADO">Atestado Médico</option>
                            <option value="ATRASO">Atraso</option>
                            <option value="FALTA_PARCIAL">Falta Parcial / Saída Antecipada</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Acionar Substituto / Cobertura (Opcional)</label>
                          <select name="substituteEmployeeId" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                            <option value="">Nenhum substituto (Deixar Descoberto)</option>
                            {activeEmployees
                              .filter(e => e.id !== a.employeeId) // não pode cobrir a si mesmo
                              .map(e => (
                                <option key={e.id} value={e.id}>{e.user?.name || e.firstName}</option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Observações</label>
                          <textarea name="description" rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                          <button type="button" onClick={() => setActiveModalId(null)} style={{ padding: '10px 16px', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                          <button type="submit" disabled={isPending} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                            {isPending ? 'Salvando...' : 'Confirmar Ocorrência'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
