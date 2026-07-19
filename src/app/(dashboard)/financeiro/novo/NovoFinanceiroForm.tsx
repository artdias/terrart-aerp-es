"use client";

import { createInvoice } from "@/actions/financeActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ClientOption {
  id: string;
  companyName: string;
}

interface NovoFinanceiroFormProps {
  clientes: ClientOption[];
  defaultClientId?: string;
}

export default function NovoFinanceiroForm({ clientes, defaultClientId }: NovoFinanceiroFormProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/financeiro" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Lançar Nova Fatura</h1>
        <p className={styles.subtitle}>Gere uma cobrança para um cliente cadastrado.</p>
      </div>

      <div className={styles.card}>
        <form action={createInvoice} className={styles.form} encType="multipart/form-data">
          
          <h3 className={styles.sectionTitle}>Destinatário</h3>
          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="clientId">Cliente Responsável <span style={{ color: '#e74c3c' }}>*</span></label>
            <select 
              id="clientId" 
              name="clientId" 
              defaultValue={defaultClientId || ""} 
              required 
              style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
            >
              <option value="">-- Selecione o Cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <h3 className={styles.sectionTitle}>Detalhes do Faturamento</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="amount">Valor da Fatura (R$) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="number" step="0.01" id="amount" name="amount" required placeholder="Ex: 2500.00" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="dueDate">Data de Vencimento <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="date" id="dueDate" name="dueDate" required />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description">Descrição / Motivo do Faturamento <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 250)</span></label>
            <input type="text" id="description" name="description" maxLength={250} placeholder="Ex: Mensalidade de Prestação de Serviços - Junho/2026" />
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '2rem' }}>
            <label htmlFor="attachment">Anexar Nota Fiscal / Comprovante <span style={{ fontSize: '0.8rem', color: '#999' }}>(Opcional)</span></label>
            <input 
              type="file" 
              id="attachment" 
              name="attachment" 
              style={{ 
                padding: '0.7rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                background: '#fafafa', 
                width: '100%',
                cursor: 'pointer' 
              }} 
            />
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>Lançar Fatura</button>
          </div>
        </form>
      </div>
    </div>
  );
}

