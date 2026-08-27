import React from "react";
import { prisma } from "@/lib/prisma";
import { editScheduleEvent } from "@/actions/receptionActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";

function formatDateTimeForInput(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
}

export default async function EditarAgendamentoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const event = await prisma.scheduleEvent.findUnique({
    where: { id },
    include: { participants: true }
  });

  if (!event) {
    redirect("/recepcao");
  }

  // Buscar usuários para a lista de agendas destinadas
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" }
  });

  // Buscar clientes e funcionários para relacionamentos opcionais
  const clients = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  const employees = await prisma.employee.findMany({ 
    where: { deleted: false, status: "Ativo" }, 
    include: { user: true },
    orderBy: { firstName: "asc" }
  });

  const participantIds = event.participants.map(p => p.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/recepcao" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Agendamento</h1>
        <p className={styles.subtitle}>Altere as informações da reunião ou compromisso.</p>
      </div>

      <div className={styles.card}>
        <form action={editScheduleEvent} className={styles.form}>
          <input type="hidden" name="id" value={event.id} />
          <h3 className={styles.sectionTitle}>
            <CalendarDays size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#003366' }} />
            Dados do Agendamento
          </h3>

          <div className={styles.inputGroup}>
            <label htmlFor="title">Assunto / Título do Compromisso <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={event.title}
              placeholder="Ex: Reunião de Alinhamento Comercial"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="startAt">Data & Hora de Início <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="datetime-local"
                id="startAt"
                name="startAt"
                defaultValue={formatDateTimeForInput(event.startAt)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="endAt">Data & Hora de Término <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="datetime-local"
                id="endAt"
                name="endAt"
                defaultValue={formatDateTimeForInput(event.endAt)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Participantes / Agendas <span style={{ color: '#e74c3c' }}>*</span></label>
              <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  padding: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
              }}>
                {users.map((u) => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#333' }}>
                    <input 
                      type="checkbox" 
                      name="participantIds" 
                      value={u.id} 
                      defaultChecked={participantIds.includes(u.id)}
                    />
                    {u.name} ({u.role})
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="privacy">Nível de Privacidade <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="privacy"
                name="privacy"
                defaultValue={event.privacy}
                required
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fafafa',
                  fontSize: '0.9rem'
                }}
              >
                <option value="PUBLICO">Público (Visível na recepção)</option>
                <option value="PRIVADO">Privado (Apenas dono e criador)</option>
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
            Vínculos Opcionais (Agenda Interativa)
          </h3>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="clientId">Vincular a Cliente</label>
              <select
                id="clientId"
                name="clientId"
                defaultValue={event.clientId || ""}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fafafa',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">-- Nenhum Cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="employeeId">Vincular a Funcionário</label>
              <select
                id="employeeId"
                name="employeeId"
                defaultValue={event.employeeId || ""}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fafafa',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">-- Nenhum Funcionário --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.user?.name || `${e.firstName} ${e.lastName}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.footer} style={{ marginTop: '2.5rem' }}>
            <button type="submit" className={styles.submitBtn}>
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
