"use client";

import { updateInvoice } from "@/actions/financeActions";
import styles from "../../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ClientOption {
  id: string;
  companyName: string;
}

interface EditFaturaFormProps {
  clientes: ClientOption[];
  invoice: any;
}

export default function EditFaturaForm({ clientes, invoice }: EditFaturaFormProps) {
  const formattedDueDate = new Date(invoice.dueDate).toISOString().split('T')[0];
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/financeiro" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Fatura</h1>
        <p className={styles.subtitle}>Corrija os dados da fatura ou reverta seu status se necessário.</p>
      </div>

      <div className={styles.card}>
        <form action={updateInvoice.bind(null, invoice.id)} className={styles.form} encType="multipart/form-data">
          
          <h3 className={styles.sectionTitle}>Destinatário e Status</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 2 }}>
              <label htmlFor="clientId">Cliente Responsável <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="clientId" 
                name="clientId" 
                defaultValue={invoice.clientId} 
                required 
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
              >
                <option value="">-- Selecione o Cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="status">Status da Fatura <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="status" 
                name="status" 
                defaultValue={invoice.status} 
                required 
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago / Concluído</option>
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Detalhes do Faturamento</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="amount">Valor da Fatura (R$) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="number" step="0.01" id="amount" name="amount" defaultValue={invoice.amount} required placeholder="Ex: 2500.00" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="dueDate">Data de Vencimento <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="date" id="dueDate" name="dueDate" defaultValue={formattedDueDate} required />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description">Descrição / Motivo do Faturamento <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 250)</span></label>
            <input type="text" id="description" name="description" defaultValue={invoice.description} maxLength={250} placeholder="Ex: Mensalidade de Prestação de Serviços - Junho/2026" />
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '2rem' }}>
            <label htmlFor="attachment">Substituir Nota Fiscal / Comprovante <span style={{ fontSize: '0.8rem', color: '#999' }}>(Opcional)</span></label>
            {invoice.fileName && (
              <div style={{ fontSize: '0.85rem', color: '#27ae60', marginBottom: '8px', fontWeight: 600 }}>
                Arquivo Atual: {invoice.fileName}
              </div>
            )}
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
            <button type="submit" className={styles.submitBtn} style={{ background: '#f39c12' }}>Salvar Edição</button>
          </div>
        </form>
      </div>
    </div>
  );
}
