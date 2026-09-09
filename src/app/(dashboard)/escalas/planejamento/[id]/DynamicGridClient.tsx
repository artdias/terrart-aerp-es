"use client";

import { useState } from "react";
import { Check, X, Plus } from "lucide-react";
import { addManualShift, removeManualShift } from "@/actions/dynamicScheduleActions";
import { generateScheduleDraft } from "@/actions/scheduleGeneratorActions";
import { registerOccurrence, registerCoverage } from "@/actions/occurrenceActions";

export default function DynamicGridClient({ 
  schedule, 
  daysArray, 
  gridMap, 
  employees, 
  shifts 
}: { 
  schedule: any; 
  daysArray: number[]; 
  gridMap: any; 
  employees: any[]; 
  shifts: any[] 
}) {
  const [isPending, setIsPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [roleOverride, setRoleOverride] = useState("");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [actionView, setActionView] = useState<"MAIN" | "OCCURRENCE" | "COVERAGE">("MAIN");
  const [occType, setOccType] = useState("");
  const [occDesc, setOccDesc] = useState("");
  const [substituteId, setSubstituteId] = useState("");
  const [subStartTime, setSubStartTime] = useState("");
  const [subEndTime, setSubEndTime] = useState("");
  const [subReason, setSubReason] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const wpName = schedule.workplace?.name || "Global";

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  }

  async function handleAddShift(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDay || !selectedEmployee || !selectedShift) return;

    setIsPending(true);
    const dateStr = `${schedule.competencyMonth}-${String(selectedDay).padStart(2, '0')}`;
    
    try {
      await addManualShift(schedule.id, selectedEmployee, dateStr, selectedShift, schedule.workplaceId, roleOverride);
      setModalOpen(false);
      setSelectedEmployee("");
      setSelectedShift("");
      setRoleOverride("");
    } catch (err: any) {
      alert(err.message || "Erro ao adicionar plantão.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemoveShift(assignmentId: string) {
    if (confirm("Remover este plantão da grade?")) {
      setIsPending(true);
      try {
        await removeManualShift(assignmentId, schedule.id);
        closeDetailsModal();
      } catch (err: any) {
        alert("Erro ao remover plantão.");
      } finally {
        setIsPending(false);
      }
    }
  }

  function openDetailsModal(assignment: any, empName: string, roleToShow: string) {
    setSelectedAssignment({ ...assignment, empName, roleToShow });
    setSubStartTime(assignment.shift.startTime);
    setSubEndTime(assignment.shift.endTime);
    setSubReason("");
    setActionView("MAIN");
    setDetailsModalOpen(true);
  }

  function closeDetailsModal() {
    setDetailsModalOpen(false);
    setSelectedAssignment(null);
    setOccType("");
    setOccDesc("");
    setSubstituteId("");
    setSubStartTime("");
    setSubEndTime("");
    setSubReason("");
  }

  async function handleSubmitOccurrence(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssignment || !occType) return;
    setIsPending(true);
    const fd = new FormData();
    fd.append("assignmentId", selectedAssignment.id);
    fd.append("employeeId", selectedAssignment.employeeId);
    fd.append("type", occType);
    fd.append("description", occDesc);
    try {
      await registerOccurrence(fd);
      showToast("Ocorrência registrada com sucesso!");
      closeDetailsModal();
    } catch(err: any) {
      alert("Erro ao registrar: " + err.message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleSubmitCoverage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssignment || !substituteId) return;
    
    // Validar se o horário está dentro do turno original
    const origStart = selectedAssignment.shift.startTime;
    const origEnd = selectedAssignment.shift.endTime;
    
    // Lógica simples de validação (supondo que turnos que viram a noite já são tratados, 
    // a validação string direta pode ser problemática se virar a noite, 
    // mas se for no mesmo dia, subStartTime >= origStart). 
    // Para simplificar e evitar bloqueios errados em turnos noturnos:
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    
    let subS = toMinutes(subStartTime);
    let subE = toMinutes(subEndTime);
    let origS = toMinutes(origStart);
    let origE = toMinutes(origEnd);
    
    // Ajuste para turno noturno
    if (origE < origS) origE += 24 * 60;
    if (subE < subS) subE += 24 * 60;
    // Se o turno do sub cruza a meia noite e começa cedo (ex: original 19:00 as 07:00, e a sub é 01:00 as 07:00)
    if (subS < origS && subS < origE % (24 * 60)) {
       subS += 24 * 60;
       if (subE < subS) subE += 24 * 60;
    }

    if (subS < origS || subE > origE) {
      alert("O horário do substituto não pode estar fora do horário do turno original (" + origStart + " às " + origEnd + ").");
      return;
    }

    setIsPending(true);
    const fd = new FormData();
    fd.append("assignmentId", selectedAssignment.id);
    fd.append("originalEmployeeId", selectedAssignment.employeeId);
    fd.append("substituteEmployeeId", substituteId);
    fd.append("startTime", subStartTime);
    fd.append("endTime", subEndTime);
    if (subReason) fd.append("reason", subReason);
    
    try {
      await registerCoverage(fd);
      showToast("Cobertura registrada com sucesso!");
      closeDetailsModal();
    } catch(err: any) {
      alert("Erro ao registrar: " + err.message);
    } finally {
      setIsPending(false);
    }
  }

  function openModal(day: number, empId?: string) {
    setSelectedDay(day);
    if (empId) setSelectedEmployee(empId);
    setModalOpen(true);
  }

  // Obter lista única de funcionários que já estão na grade
  const assignedEmployees = Object.keys(gridMap[wpName] || {});

  // Preparar dados para o formato Calendário
  const [year, month] = schedule.competencyMonth.split("-").map(Number);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 (Dom) a 6 (Sáb)
  const emptyCellsBefore = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  
  const lastDay = new Date(year, month, 0);
  const lastDayOfWeek = lastDay.getDay();
  const emptyCellsAfter = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => i);

  // Agrupar plantões por dia (em vez de por funcionário)
  const assignmentsByDay: Record<number, any[]> = {};
  daysArray.forEach(d => { assignmentsByDay[d] = []; });

  assignedEmployees.forEach(empName => {
    daysArray.forEach(d => {
      const assignment = gridMap[wpName]?.[empName]?.[d];
      if (assignment) {
        assignmentsByDay[d].push({
          empName,
          assignment
        });
      }
    });
  });

  async function handleGenerateDraft() {
    if (confirm("Isso irá gerar os plantões automaticamente para os funcionários que tem este posto como padrão. Continuar?")) {
      setIsPending(true);
      try {
        await generateScheduleDraft(schedule.id);
      } catch (err: any) {
        alert("Erro ao preencher.");
      } finally {
        setIsPending(false);
      }
    }
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px 16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Posto: {wpName}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Botões removidos a pedido do usuário */}
        </div>
      </div>
      
      <div className="print-rotated-wrapper">
        <div className="print-rotated-content">
          <div className="print-compact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#e2e8f0' }}>
          {/* Header dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} style={{ backgroundColor: '#f8fafc', padding: '12px 8px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
              {day}
            </div>
          ))}

          {/* Células vazias antes do dia 1 */}
          {emptyCellsBefore.map(i => (
            <div key={`empty-${i}`} style={{ backgroundColor: '#f8fafc', minHeight: '120px' }}></div>
          ))}

          {/* Dias do mês */}
          {daysArray.map(d => (
            <div key={d} style={{ backgroundColor: 'white', minHeight: '120px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155', fontSize: '1.1rem', lineHeight: 1 }}>{d}</span>
                {schedule.status !== "ENCERRADA" && (
                  <button 
                    onClick={() => openModal(d)} 
                    title="Adicionar plantão neste dia"
                    className="hide-on-print"
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
                {assignmentsByDay[d].map(item => {
                  const hasCoverage = item.assignment.coverages && item.assignment.coverages.length > 0;
                  const activeCoverage = hasCoverage ? item.assignment.coverages[item.assignment.coverages.length - 1] : null;

                  const roleToShow = item.assignment.roleOverride || item.assignment.employee?.roleTitle || "Função não definida";
                  
                  let displayEmpName = item.empName;
                  let bgCol = '#e0f2fe';
                  let textCol = '#0369a1';
                  let borderCol = '#0ea5e9';

                  if (activeCoverage) {
                    const sub = activeCoverage.substituteEmployee;
                    const subName = sub?.user?.name || sub?.firstName || "Substituto";
                    displayEmpName = subName;
                    bgCol = '#dcfce7'; // green-100
                    textCol = '#166534'; // green-800
                    borderCol = '#22c55e'; // green-500
                  } else if (item.assignment.status === 'FALTA' || item.assignment.status === 'FALTA_INTEGRAL') {
                    bgCol = '#fee2e2';
                    textCol = '#991b1b';
                    borderCol = '#ef4444';
                  }
                  
                  let hoverTitle = `Nome: ${item.empName}\nFunção: ${roleToShow}\nTurno: ${item.assignment.shift.name} (${item.assignment.shift.startTime} às ${item.assignment.shift.endTime})\nStatus: ${item.assignment.status}`;
                  
                  if (activeCoverage) {
                     const formatCoverageTime = (isoString: string) => {
                        const d = new Date(isoString);
                        let h = d.getUTCHours() - 3;
                        if (h < 0) h += 24;
                        const m = d.getUTCMinutes();
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                     };
                     const sStart = formatCoverageTime(activeCoverage.startTime);
                     const sEnd = formatCoverageTime(activeCoverage.endTime);
                     hoverTitle += `\n\n[SUBSTITUIÇÃO]\nSubstituto: ${displayEmpName}\nSubstituído: ${item.empName}\nHorário Cobertura: ${sStart} às ${sEnd}`;
                  }
                  
                  hoverTitle += `\n\nClique para alterar ou remover.`;

                  // Format name nicely (First Name + Last Initial)
                  const nameParts = displayEmpName.split(' ');
                  let shortName = nameParts[0];
                  if (nameParts.length > 1) {
                    shortName += ' ' + nameParts[nameParts.length - 1].charAt(0) + '.';
                  }

                  return (
                    <div 
                      key={item.assignment.id} 
                      onClick={() => openDetailsModal(item.assignment, item.empName, roleToShow)}
                      title={hoverTitle}
                      style={{ backgroundColor: bgCol, color: textCol, padding: '4px 6px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderLeft: `3px solid ${borderCol}` }}
                    >
                      <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {activeCoverage && <span style={{marginRight:'4px'}} title="Substituição">🔄</span>}
                        {shortName}
                      </span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{roleToShow}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Células vazias depois do último dia (opcional, mas bom para alinhar a grade) */}
          {emptyCellsAfter.map(i => (
             <div key={`empty-end-${i}`} style={{ backgroundColor: '#f8fafc', minHeight: '120px' }}></div>
          ))}
        </div>
        </div>
      </div>
      
      <div className="print-only page-break" style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Detalhamento da Escala - {schedule.competencyMonth}</h2>
        {daysArray.map(d => {
          const items = assignmentsByDay[d];
          if (items.length === 0) return null;
          
          return (
            <div key={`detail-${d}`} style={{ marginBottom: '16px', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px 0', color: '#334155', borderBottom: '1px solid #ccc' }}>Dia {d}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Funcionário</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Função</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Horário</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Substituição / Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const hasCoverage = item.assignment.coverages && item.assignment.coverages.length > 0;
                    const activeCoverage = hasCoverage ? item.assignment.coverages[item.assignment.coverages.length - 1] : null;
                    const roleToShow = item.assignment.roleOverride || item.assignment.employee?.roleTitle || "Função não definida";
                    
                    let statusLabel = item.assignment.status;
                    let subDetails = "-";
                    
                    if (activeCoverage) {
                      const sub = activeCoverage.substituteEmployee;
                      const subName = sub?.user?.name || sub?.firstName || "Substituto";
                      
                      const formatCoverageTime = (isoString: string) => {
                        const d = new Date(isoString);
                        let h = d.getUTCHours() - 3;
                        if (h < 0) h += 24;
                        const m = d.getUTCMinutes();
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      };
                      
                      const sStart = formatCoverageTime(activeCoverage.startTime);
                      const sEnd = formatCoverageTime(activeCoverage.endTime);
                      
                      subDetails = `Coberto por ${subName} (${sStart} às ${sEnd})${activeCoverage.reason ? ` - Motivo: ${activeCoverage.reason}` : ''}`;
                    }

                    return (
                      <tr key={`row-${d}-${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}>{item.empName}</td>
                        <td style={{ padding: '8px' }}>{roleToShow}</td>
                        <td style={{ padding: '8px' }}>{item.assignment.shift.startTime} às {item.assignment.shift.endTime}</td>
                        <td style={{ padding: '8px' }}>{statusLabel}</td>
                        <td style={{ padding: '8px' }}>{subDetails}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Adicionar Plantão - Dia {selectedDay}</h2>
            
            <form onSubmit={handleAddShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Funcionário</label>
                <select 
                  value={selectedEmployee} 
                  onChange={e => setSelectedEmployee(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="">Selecione...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.user?.name || e.firstName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Turno</label>
                <select 
                  value={selectedShift} 
                  onChange={e => setSelectedShift(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="">Selecione...</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Função no Plantão (Opcional)</label>
                <input 
                  type="text" 
                  value={roleOverride} 
                  onChange={e => setRoleOverride(e.target.value)}
                  placeholder="Ex: Portaria, Segurança..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Se vazio, será exibida a função principal do funcionário.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 16px', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={isPending} style={{ padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  {isPending ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detailsModalOpen && selectedAssignment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '450px' }}>
            <h2 style={{ margin: '0 0 16px 0' }}>Detalhes do Plantão</h2>
            
            {(() => {
              const hasCoverage = selectedAssignment.coverages && selectedAssignment.coverages.length > 0;
              const activeCov = hasCoverage ? selectedAssignment.coverages[selectedAssignment.coverages.length - 1] : null;

              const formatCoverageTime = (isoString: string) => {
                 const d = new Date(isoString);
                 let h = d.getUTCHours() - 3;
                 if (h < 0) h += 24;
                 const m = d.getUTCMinutes();
                 return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              };

              return (
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Funcionário Original:</strong> {selectedAssignment.empName}</p>
                  
                  {activeCov && (
                    <div style={{ backgroundColor: '#dcfce7', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #22c55e' }}>
                      <p style={{ margin: '0 0 4px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span title="Substituição">🔄</span> 
                        <strong>Substituto: {activeCov.substituteEmployee.user?.name || activeCov.substituteEmployee.firstName}</strong>
                      </p>
                      <p style={{ margin: 0, color: '#166534', fontSize: '0.85rem', paddingLeft: '24px' }}>
                        Cobertura das {formatCoverageTime(activeCov.startTime)} às {formatCoverageTime(activeCov.endTime)}
                      </p>
                      {activeCov.reason && (
                        <p style={{ margin: '4px 0 0 0', color: '#14532d', fontSize: '0.8rem', paddingLeft: '24px', fontStyle: 'italic' }}>
                          Motivo: {activeCov.reason}
                        </p>
                      )}
                    </div>
                  )}

                  <p style={{ margin: '0 0 8px 0' }}><strong>Função:</strong> {selectedAssignment.roleToShow}</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Turno Original:</strong> {selectedAssignment.shift.name} ({selectedAssignment.shift.startTime} às {selectedAssignment.shift.endTime})</p>
                  <p style={{ margin: 0 }}><strong>Status:</strong> <span style={{ padding: '2px 8px', background: '#e2e8f0', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{selectedAssignment.status}</span></p>
                </div>
              );
            })()}

            {actionView === "MAIN" && schedule.status !== "ENCERRADA" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => setActionView("COVERAGE")} 
                  style={{ padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center' }}
                >
                  Acionar Substituto
                </button>
                <button 
                  onClick={() => handleRemoveShift(selectedAssignment.id)} 
                  style={{ padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center' }}
                >
                  Excluir Plantão
                </button>
                <button 
                  onClick={closeDetailsModal} 
                  style={{ padding: '12px', background: 'transparent', border: '1px solid #d1d5db', color: '#4b5563', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', marginTop: '8px' }}
                >
                  Fechar
                </button>
              </div>
            )}
            
            {actionView === "MAIN" && schedule.status === "ENCERRADA" && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <p style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 12px 0' }}>Esta escala está ENCERRADA e não pode ser alterada.</p>
                 <button 
                  onClick={closeDetailsModal} 
                  style={{ padding: '12px', background: 'transparent', border: '1px solid #d1d5db', color: '#4b5563', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center' }}
                >
                  Fechar
                </button>
               </div>
            )}

            {actionView === "COVERAGE" && (
              <form onSubmit={handleSubmitCoverage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Selecionar Substituto</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Funcionário Disponível</label>
                  <select required value={substituteId} onChange={e => setSubstituteId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <option value="">Selecione um substituto...</option>
                    {/* Filtra o titular atual para não aparecer na lista de substitutos */}
                    {employees.filter(e => e.id !== selectedAssignment.employeeId).map(e => (
                      <option key={e.id} value={e.id}>{e.user?.name || e.firstName}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Hora Inicial</label>
                    <input type="time" required value={subStartTime} onChange={e => setSubStartTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Hora Final</label>
                    <input type="time" required value={subEndTime} onChange={e => setSubEndTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Motivo da Substituição (Opcional)</label>
                  <input type="text" value={subReason} onChange={e => setSubReason(e.target.value)} placeholder="Ex: Falta médica, almoço, etc." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setActionView("MAIN")} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Voltar</button>
                  <button type="submit" disabled={isPending} style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>{isPending ? 'Salvando...' : 'Confirmar Cobertura'}</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fadein 0.3s'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
