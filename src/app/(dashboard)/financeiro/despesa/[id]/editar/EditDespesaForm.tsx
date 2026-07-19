"use client";

import React from "react";
import { updateExpense } from "@/actions/expenseActions";
import styles from "../../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, FileText, Paperclip } from "lucide-react";

interface EditDespesaFormProps {
  expense: any;
}

export default function EditDespesaForm({ expense }: EditDespesaFormProps) {
  const formattedDueDate = new Date(expense.dueDate).toISOString().split('T')[0];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/financeiro?tab=despesas" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Despesa</h1>
        <p className={styles.subtitle}>Corrija os valores, datas ou o status desta despesa.</p>
      </div>

      <div className={styles.card}>
        <form action={updateExpense.bind(null, expense.id)} className={styles.form} encType="multipart/form-data">
          
          <h3 className={styles.sectionTitle}>Dados Gerais da Despesa</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 2 }}>
              <label htmlFor="description">Descrição / Motivo da Despesa <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="description" 
                name="description" 
                defaultValue={expense.description}
                required 
                maxLength={150} 
                placeholder="Ex: Conta de Luz - Julho/2026..." 
              />
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="category">Categoria da Despesa <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="category" 
                name="category" 
                defaultValue={expense.category}
                required
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}
              >
                <option value="Energia">Energia / Luz</option>
                <option value="Água">Água / Saneamento</option>
                <option value="Internet">Internet / Telefone</option>
                <option value="Limpeza">Material de Limpeza</option>
                <option value="Copa">Copa e Cozinha</option>
                <option value="Escritório">Material de Escritório</option>
                <option value="Aluguel">Aluguel / Condomínio</option>
                <option value="Outros">Outros Custos</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="amount">Valor Total (R$) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="number" 
                step="0.01" 
                id="amount" 
                name="amount" 
                defaultValue={expense.amount}
                required 
                placeholder="Ex: 350.50" 
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="dueDate">Data de Vencimento <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="date" 
                id="dueDate" 
                name="dueDate"
                defaultValue={formattedDueDate}
                required 
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="status">Status do Pagamento <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="status" 
                name="status"
                defaultValue={expense.status}
                required
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}
              >
                <option value="PENDING">Pendente (A Pagar)</option>
                <option value="PAID">Pago (Liquidado)</option>
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Atualizar Comprovantes (Opcional)</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="bill">Nota Fiscal / Boleto / Fatura</label>
              {expense.billName && (
                <div style={{ fontSize: '0.85rem', color: '#2980b9', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={14} /> Arquivo Atual: {expense.billName}
                </div>
              )}
              <input 
                type="file" 
                id="bill" 
                name="bill" 
                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="receipt">Comprovante de Pagamento</label>
              {expense.receiptName && (
                <div style={{ fontSize: '0.85rem', color: '#27ae60', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Paperclip size={14} /> Arquivo Atual: {expense.receiptName}
                </div>
              )}
              <input 
                type="file" 
                id="receipt" 
                name="receipt" 
                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className={styles.footer} style={{ marginTop: '2rem' }}>
            <button type="submit" className={styles.submitBtn} style={{ background: '#f39c12' }}>Salvar Edição</button>
          </div>
        </form>
      </div>
    </div>
  );
}
