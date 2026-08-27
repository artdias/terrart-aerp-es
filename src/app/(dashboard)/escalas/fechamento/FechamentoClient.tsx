"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processFinancialAdjustments } from "@/actions/monthlyClosingActions";
import { Calculator, CheckCircle2, AlertCircle } from "lucide-react";

export default function FechamentoClient({ 
  currentMonth, 
  initialData 
}: { 
  currentMonth: string;
  initialData: any[];
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/escalas/fechamento?month=${e.target.value}`);
  }

  async function handleProcess(employeeId: string, empName: string) {
    if (confirm(`Processar fechamento de ${empName} para o mês ${currentMonth}? Isso irá gerar pendências financeiras para Faltas e Coberturas Extras.`)) {
      setIsPending(true);
      try {
        await processFinancialAdjustments(employeeId, currentMonth);
        alert("Processado com sucesso!");
      } catch (err: any) {
        alert(err.message || "Erro ao processar.");
      } finally {
        setIsPending(false);
      }
    }
  }

  return (
    <div>
      {/* Barra de Filtro */}
      <div style={{ backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label style={{ fontWeight: 600 }}>Mês de Competência:</label>
        <input 
          type="month" 
          value={currentMonth} 
          onChange={handleMonthChange}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {initialData.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Nenhum dado encontrado para este mês.</p>
          </div>
        ) : (
          initialData.map((data, idx) => {
            const empName = data.employee.user?.name || data.employee.firstName || "Sem Nome";
            const unpocessedOccurrences = data.occurrences.filter((o: any) => o.status !== "PROCESSADO").length;
            const unprocessedCoverages = data.coveragesAsSub.filter((c: any) => c.status !== "PROCESSADO").length;
            
            const hasPending = unpocessedOccurrences > 0 || unprocessedCoverages > 0;

            return (
              <div key={data.employee.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {empName}
                    </h3>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: '#4b5563' }}>
                      <span><strong>Plantões Planejados:</strong> {data.totalPlannedShifts}</span>
                      <span><strong>Presenças Confirmadas:</strong> {data.totalCompletedShifts}</span>
                      <span style={{ color: data.totalAbsences > 0 ? '#ef4444' : 'inherit' }}>
                        <strong>Faltas/Ausências:</strong> {data.totalAbsences}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {hasPending ? (
                      <button 
                        onClick={() => handleProcess(data.employee.id, empName)}
                        disabled={isPending}
                        style={{ padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Calculator size={18} /> Consolidar Folha
                      </button>
                    ) : (
                      <div style={{ padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #4ade80', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} /> Fechado / Sem Pendências
                      </div>
                    )}
                  </div>
                </div>

                {hasPending && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} /> Eventos pendentes de envio para o financeiro:
                    </h4>
                    
                    {unpocessedOccurrences > 0 && (
                      <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '8px' }}>
                        • {unpocessedOccurrences} ocorrência(s) de desconto (Falta/Atraso).
                      </div>
                    )}
                    
                    {unprocessedCoverages > 0 && (
                      <div style={{ color: '#10b981', fontSize: '0.9rem' }}>
                        • {unprocessedCoverages} plantão(ões) extra(s) realizado(s) como substituto.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
