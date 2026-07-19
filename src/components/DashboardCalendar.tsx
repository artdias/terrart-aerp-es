"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Building2, Plus, X, Globe, Lock } from "lucide-react";
import { createCalendarEvent } from "@/actions/receptionActions";

interface Event {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  privacy: string;
  creatorId: string;
  participants?: { id: string; name?: string }[];
  clientId: string | null;
  employeeId: string | null;
  client?: { companyName: string } | null;
  employee?: { firstName: string; lastName: string | null } | null;
}

interface DropdownItem {
  id: string;
  name?: string;
  companyName?: string;
}

interface DashboardCalendarProps {
  events: Event[];
  users: DropdownItem[];
  clients: DropdownItem[];
  employees: DropdownItem[];
}

export default function DashboardCalendar({ events, users, clients, employees }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dias do mês
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Nomes dos meses em português
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filtrar eventos do dia selecionado
  const getEventsForDate = (date: Date) => {
    return events.filter((e) => {
      const eventStart = new Date(e.startAt);
      return (
        eventStart.getFullYear() === date.getFullYear() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getDate() === date.getDate()
      );
    });
  };

  // Verificar se uma data possui eventos
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  // Gerar grid de dias do calendário
  const calendarDays = [];
  // Espaços vazios no início do mês
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Dias do mês
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", position: "relative" }}>
      {/* Header do Calendário */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#002244", display: "flex", alignItems: "center", gap: "8px" }}>
          <CalendarIcon size={20} color="#003366" />
          Agenda de Compromissos ({monthNames[month]} de {year})
        </h3>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#003366",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Plus size={14} /> Novo Agendamento
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={handlePrevMonth}
              style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center", marginBottom: "16px" }}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", paddingBottom: "6px" }}>
            {d}
          </div>
        ))}

        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} />;
          }

          const isSelected = selectedDate &&
            selectedDate.getDate() === date.getDate() &&
            selectedDate.getMonth() === date.getMonth() &&
            selectedDate.getFullYear() === date.getFullYear();

          const isToday = new Date().toDateString() === date.toDateString();
          const hasEvts = hasEvents(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => setSelectedDate(date)}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                background: isSelected ? "#003366" : isToday ? "#e0f2fe" : "white",
                color: isSelected ? "white" : isToday ? "#0369a1" : "#1e293b",
                border: "1px solid #f1f5f9",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: isToday || isSelected ? "bold" : "normal",
                cursor: "pointer"
              }}
            >
              {date.getDate()}
              {hasEvts && (
                <span style={{
                  position: "absolute",
                  bottom: "4px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: isSelected ? "white" : "#e74c3c"
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Detalhes do Dia Selecionado */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
        <h4 style={{ margin: "0 0 16px 0", fontSize: "0.95rem", color: "#1e293b" }}>
          Compromissos para o dia {selectedDate ? selectedDate.toLocaleDateString("pt-BR") : ""}
        </h4>

        {selectedDayEvents.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
            Sem compromissos agendados para este dia.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selectedDayEvents.map((evt) => {
              const start = new Date(evt.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const end = new Date(evt.endAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const isDone = evt.status === "CONCLUIDO";

              return (
                <div 
                  key={evt.id} 
                  style={{ 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "8px", 
                    padding: "12px 16px",
                    background: isDone ? "#f8fafc" : "#fff",
                    borderLeft: `4px solid ${isDone ? "#27ae60" : "#3498db"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.9rem", color: "#0f172a", textDecoration: isDone ? "line-through" : "none" }}>
                      {evt.title}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {evt.privacy === "PRIVADO" ? (
                        <span title="Evento Privado" style={{ color: "#7f8c8d" }}><Lock size={12} /></span>
                      ) : (
                        <span title="Evento Público" style={{ color: "#7f8c8d" }}><Globe size={12} /></span>
                      )}
                      <span style={{
                        fontSize: "0.72rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        background: isDone ? "#e8f8f0" : "#ebf5fb",
                        color: isDone ? "#27ae60" : "#2980b9"
                      }}>
                        {evt.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem", color: "#64748b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      <span>{start} - {end}</span>
                    </div>

                    {evt.client && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Building2 size={12} />
                        <span>Cliente: {evt.client.companyName}</span>
                      </div>
                    )}

                    {evt.employee && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <User size={12} />
                        <span>Profissional: {evt.employee.firstName} {evt.employee.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Compromisso */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "white",
            width: "100%",
            maxWidth: "500px",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "#003366",
              color: "white"
            }}>
              <strong style={{ fontSize: "1.05rem" }}>Novo Agendamento na Agenda</strong>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <form action={createCalendarEvent} onSubmit={() => setShowModal(false)} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Título do Compromisso / Assunto <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  type="text"
                  name="title"
                  placeholder="Ex: Reunião de Alocação de Posto"
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Início <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="datetime-local"
                    name="startAt"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Término <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Participantes <span style={{ color: '#e74c3c' }}>*</span></label>
                <div style={{ maxHeight: "120px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "10px", background: "white", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {users.map((u) => (
                    <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "#333" }}>
                      <input type="checkbox" name="participantIds" value={u.id} />
                      {u.name || "Sem Nome"}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Cliente Vinculado (Opcional)</label>
                  <select
                    name="clientId"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
                  >
                    <option value="">Nenhum</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName || c.name || "Sem Nome"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Profissional (Opcional)</label>
                  <select
                    name="employeeId"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
                  >
                    <option value="">Nenhum</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name || "Sem Nome"}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Privacidade</label>
                <select
                  name="privacy"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
                >
                  <option value="PUBLICO">Público (Todos visualizam)</option>
                  <option value="PRIVADO">Privado (Apenas eu e o responsável)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#003366",
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Gravar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

