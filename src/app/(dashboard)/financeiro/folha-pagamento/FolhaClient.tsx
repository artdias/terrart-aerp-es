"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerPayrollPayment } from "@/actions/payrollActions";
import { CheckCircle2, DollarSign, Calculator } from "lucide-react";

export default function FolhaClient({ 
  currentMonth, 
  initialData, 
  workplaces,
  currentWorkplace
}: { 
  currentMonth: string;
  initialData: any[];
  workplaces?: any[];
  currentWorkplace?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState("pendentes");

  const pendentesData = initialData.filter(d => !d.isPaid);
  const pagasData = initialData.filter(d => d.isPaid);

  const displayData = activeTab === "pendentes" ? pendentesData : pagasData;

  function handleFilterChange(month: string, workplace: string) {
    let url = `/financeiro/folha-pagamento?month=${month}`;
    if (workplace) url += `&workplaceId=${workplace}`;
    router.push(url);
  }

  async function handlePay(employeeId: string, empName: string, amount: number) {
    if (!confirm(`Confirmar lançamento de pagamento (R$ ${amount.toFixed(2)}) para ${empName}? Isso gerará uma Despesa paga no sistema.`)) return;
    
    setIsPending(true);
    try {
      await registerPayrollPayment(employeeId, currentMonth, amount, empName);
      alert("Pagamento registrado com sucesso!");
      router.refresh();
    } catch (error: any) {
      alert("Erro ao registrar: " + error.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="hide-on-print" style={{ backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
            <label style={{ fontWeight: 600 }}>Filtro de Empresa:</label>
            <select 
              value={currentWorkplace || "ALL"} 
              onChange={e => handleFilterChange(currentMonth, e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }}
            >
              <option value="ALL">Todas as Empresas (Consolidado)</option>
              {workplaces?.map(wp => (
                <option key={wp.id} value={wp.id}>{wp.client.companyName} - {wp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          style={{ padding: '10px 20px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Imprimir Folha Geral
        </button>
      </div>

      {/* Tabs */}
      <div className="hide-on-print" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab("pendentes")}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
            borderBottom: activeTab === "pendentes" ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === "pendentes" ? '#0284c7' : '#64748b'
          }}
        >
          Pendentes de Pagamento ({pendentesData.length})
        </button>
        <button 
          onClick={() => setActiveTab("pagas")}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
            borderBottom: activeTab === "pagas" ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === "pagas" ? '#10b981' : '#64748b'
          }}
        >
          Folhas Pagas ({pagasData.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayData.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Nenhuma folha encontrada nesta aba.</p>
          </div>
        ) : (
          displayData.map((data, idx) => {
            const empName = data.employee.user?.name || data.employee.firstName || "Sem Nome";
            const baseSalary = data.employee.salary || 0;
            const hourlyWage = baseSalary / 220;

            let missedMinutes = 0;
            let discountTooltip = "";
            data.occurrences.forEach((occ: any) => {
              if (occ.type === "FALTA_INTEGRAL" || occ.type === "ABANDONO") {
                  if (occ.assignment?.shift) {
                    const [sh, sm] = occ.assignment.shift.startTime.split(":").map(Number);
                    const [eh, em] = occ.assignment.shift.endTime.split(":").map(Number);
                    let m = (eh * 60 + em) - (sh * 60 + sm);
                    if (m < 0) m += 24 * 60;
                    missedMinutes += m;
                    
                    const dateStr = new Date(occ.assignment.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' });
                    discountTooltip += `- ${dateStr}: ${occ.type} (${Math.floor(m/60)}h${m%60}m)\n`;
                  }
              }
            });
            if (!discountTooltip) discountTooltip = "Sem descontos.";

            let extraMinutes = 0;
            let extraTooltip = "";
            data.coveragesAsSub.forEach((cov: any) => {
                const start = new Date(cov.startTime).getTime();
                const end = new Date(cov.endTime).getTime();
                let m = Math.floor((end - start) / 60000);
                extraMinutes += m;

                const dateStr = new Date(cov.assignment.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' });
                extraTooltip += `- ${dateStr}: Cobertura (${Math.floor(m/60)}h${m%60}m)\n`;
            });
            if (!extraTooltip) extraTooltip = "Sem horas extras.";

            const payExtra = (extraMinutes / 60) * hourlyWage;
            const discount = (missedMinutes / 60) * hourlyWage;
            const finalPay = baseSalary + payExtra - discount;

            return (
              <div key={data.employee.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: data.isPaid ? '1px solid #10b981' : '1px solid #e5e7eb', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {empName}
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#64748b' }}>Postos trabalhados: {data.workplaceNames}</p>

                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div>
                         <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0' }}>Salário Base</p>
                         <p style={{ fontWeight: 600, margin: 0, color: '#334155' }}>
                           {baseSalary > 0 ? `R$ ${baseSalary.toFixed(2)}` : 'Não Cadastrado'}
                         </p>
                      </div>
                      <div title={extraTooltip} style={{ cursor: 'help' }}>
                         <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           Acréscimos ({Math.floor(extraMinutes/60)}h{extraMinutes%60}m) ℹ️
                         </p>
                         <p style={{ fontWeight: 600, margin: 0, color: '#10b981' }}>+ R$ {payExtra.toFixed(2)}</p>
                      </div>
                      <div title={discountTooltip} style={{ cursor: 'help' }}>
                         <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           Descontos ({Math.floor(missedMinutes/60)}h{missedMinutes%60}m) ℹ️
                         </p>
                         <p style={{ fontWeight: 600, margin: 0, color: '#ef4444' }}>- R$ {discount.toFixed(2)}</p>
                      </div>
                      <div>
                         <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0' }}>Líquido a Pagar</p>
                         <p style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>R$ {finalPay.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hide-on-print" style={{ display: 'flex', gap: '12px', marginLeft: '24px', alignItems: 'center' }}>
                    {data.isPaid ? (
                      <div style={{ padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #4ade80', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} /> Folha Paga
                      </div>
                    ) : (
                      <button 
                        onClick={() => handlePay(data.employee.id, empName, finalPay)}
                        disabled={isPending || baseSalary === 0}
                        style={{ padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: (isPending || baseSalary === 0) ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <DollarSign size={18} /> Registrar Pagamento
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
