"use client";

import { createAllocation } from "@/actions/allocationActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface EmployeeOption {
  id: string;
  firstName: string | null;
  roleTitle: string;
  user: {
    name: string;
  } | null;
}

interface ClientOption {
  id: string;
  companyName: string;
}

export default function NovaEscalaForm({
  funcionarios,
  clientes,
}: {
  funcionarios: EmployeeOption[];
  clientes: ClientOption[];
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);
    try {
      await createAllocation(formData);
      router.push("/escalas");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar salvar a alocação.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/escalas" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Criar Alocação / Escala</h1>
        <p className={styles.subtitle}>Especifique a tarefa, local, tempo e remuneração da alocação.</p>
      </div>

      <div className={styles.card}>
        <form action={handleSubmit} className={styles.form}>
          {error && (
            <div ref={errorRef} style={{ background: '#fdedec', color: '#c0392b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e74c3c', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <h3 className={styles.sectionTitle}>Envolvidos</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="employeeId">Funcionário Selecionado <span style={{ color: '#e74c3c' }}>*</span></label>
              <select id="employeeId" name="employeeId" required style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">-- Selecione o Terceirizado --</option>
                {funcionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.user?.name || f.firstName} ({f.roleTitle})</option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="clientId">Cliente / Local <span style={{ color: '#e74c3c' }}>*</span></label>
              <select id="clientId" name="clientId" required style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">-- Selecione a Empresa --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Detalhes do Serviço</h3>
          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="task">Tarefa a ser Executada * <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 200)</span></label>
            <input type="text" id="task" name="task" required maxLength={200} placeholder="Ex: Limpeza Pós-Obra, Vigilância 12x36, Reparos Elétricos" />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="startDate">Data/Hora de Início <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="datetime-local" id="startDate" name="startDate" required />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="endDate">Data/Hora de Término <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="datetime-local" id="endDate" name="endDate" required />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="duration">Anotações / Duração Escrita (Opcional) <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 100)</span></label>
            <input type="text" id="duration" name="duration" maxLength={100} placeholder="Ex: 8 horas diárias, 15 dias..." />
          </div>

          <h3 className={styles.sectionTitle}>Remuneração da Alocação</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="paymentValue">Valor Combinado (R$) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="number" step="0.01" id="paymentValue" name="paymentValue" required placeholder="Ex: 150.00" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="paymentFrequency">Base do Valor (Frequência) <span style={{ color: '#e74c3c' }}>*</span></label>
              <select id="paymentFrequency" name="paymentFrequency" required style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="hora">Por Hora</option>
                <option value="dia">Por Dia (Diária)</option>
                <option value="semana">Por Semana</option>
                <option value="mes">Por Mês</option>
                <option value="escala">Por Escala Completa</option>
              </select>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Verificando Agenda..." : "Ativar Alocação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

