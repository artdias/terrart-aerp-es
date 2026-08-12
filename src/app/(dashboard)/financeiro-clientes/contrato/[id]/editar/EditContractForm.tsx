"use client";

import React, { useState } from "react";
import { updateClientContract } from "@/actions/billingActions";
import styles from "../../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientOption {
  id: string;
  companyName: string;
  cnpj: string;
}

interface EditContractFormProps {
  clientes: ClientOption[];
  contract: any;
}

export default function EditContractForm({ clientes, contract }: EditContractFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateClientContract(contract.id, formData);

      if (result && result.error) {
        alert(result.error);
      } else {
        router.push("/financeiro-clientes?tab=contratos");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao atualizar o contrato.");
    } finally {
      setLoading(false);
    }
  };

  const getLocalDateString = (dateObj: Date | string | null) => {
    if (!dateObj) return "";
    const date = new Date(dateObj);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/financeiro-clientes?tab=contratos" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Contrato</h1>
        <p className={styles.subtitle}>Atualize os detalhes do contrato selecionado.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.sectionTitle}>
            <Edit size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#003366' }} />
            Dados do Contrato
          </h3>

          <div className={styles.inputGroup}>
            <label htmlFor="clientId">Cliente Contratante <span style={{ color: '#e74c3c' }}>*</span></label>
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue={contract.clientId}
              disabled
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: '#eee',
                fontSize: '0.9rem',
                cursor: 'not-allowed'
              }}
            >
              <option value="">-- Selecione o Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} (CNPJ: {c.cnpj})
                </option>
              ))}
            </select>
            <small style={{ color: '#888' }}>O cliente não pode ser alterado após a criação.</small>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="title">Descrição / Título do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Ex: Contrato de Portaria e Recepção 24h"
              required
              defaultValue={contract.title}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="value">Valor Fixo Mensal (R$) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                id="value"
                name="value"
                placeholder="Ex: 14500.00"
                required
                defaultValue={contract.value.toString().replace(".", ",")}
              />
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="billingDay">Dia de Vencimento (1 a 28) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="number"
                id="billingDay"
                name="billingDay"
                min="1"
                max="28"
                placeholder="Ex: 5"
                required
                defaultValue={contract.billingDay}
              />
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="recurrence">Recorrência <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="recurrence"
                name="recurrence"
                required
                defaultValue={contract.recurrence}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fafafa',
                  fontSize: '0.9rem'
                }}
              >
                <option value="MENSAL">Mensal</option>
                <option value="SEMANAL">Semanal</option>
                <option value="ANUAL">Anual</option>
                <option value="NENHUMA">Única (Não repete)</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="startDate">Data de Início do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                defaultValue={getLocalDateString(contract.startDate)}
                style={{ width: '100%' }}
              />
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="status">Status do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="status"
                name="status"
                required
                defaultValue={contract.status}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fafafa',
                  fontSize: '0.9rem'
                }}
              >
                <option value="ATIVO">ATIVO</option>
                <option value="RESCINDIDO">RESCINDIDO / CANCELADO</option>
              </select>
            </div>
          </div>

          <div className={styles.footer} style={{ marginTop: '2rem' }}>
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading}
              style={{
                background: loading ? '#95a5a6' : '#f39c12',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
