import React from "react";
import { prisma } from "@/lib/prisma";
import { createScheduleEvent } from "@/actions/receptionActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default async function NovoAgendamentoPage() {
  // Buscar usuários para a lista de agendas destinadas
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" }
  });

  // Buscar clientes e funcionários para relacionamentos opcionais
  const clients = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  const employees = await prisma.employee.findMany({ where: { deleted: false }, 
    include: { user: true },
    orderBy: { firstName: "asc" }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/recepcao" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Novo Agendamento</h1>
        <p className={styles.subtitle}>Agende uma reunião ou compromisso na agenda de um colaborador.</p>
      </div>

      <div className={styles.card}>
        <form action={createScheduleEvent} className={styles.form}>
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
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="assignedUserId">Agenda do Colaborador <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="assignedUserId"
                name="assignedUserId"
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
                <option value="">-- Selecione o Colaborador --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="privacy">Nível de Privacidade <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="privacy"
                name="privacy"
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
              Criar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

