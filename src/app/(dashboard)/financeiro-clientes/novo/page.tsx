import React from "react";
import { prisma } from "@/lib/prisma";
import { createClientContract } from "@/actions/billingActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";

export default async function NovoContratoPage() {
  const clientes = await prisma.client.findMany({
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/financeiro-clientes" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Novo Contrato de Faturamento</h1>
        <p className={styles.subtitle}>Cadastre termos de serviço recorrentes para faturamento mensal automático.</p>
      </div>

      <div className={styles.card}>
        <form action={createClientContract} className={styles.form}>
          <h3 className={styles.sectionTitle}>
            <Coins size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#003366' }} />
            Dados Básicos do Contrato
          </h3>

          <div className={styles.inputGroup}>
            <label htmlFor="clientId">Cliente Contratante <span style={{ color: '#e74c3c' }}>*</span></label>
            <select
              id="clientId"
              name="clientId"
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
              <option value="">-- Selecione o Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} (CNPJ: {c.cnpj})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="title">Descrição / Título do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Ex: Contrato de Portaria e Recepção 24h"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="value">Valor Fixo Mensal (R$) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                id="value"
                name="value"
                placeholder="Ex: 14500,00"
                required
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
              />
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="recurrence">Recorrência <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="recurrence"
                name="recurrence"
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
                <option value="MENSAL">Mensal</option>
                <option value="SEMANAL">Semanal</option>
                <option value="ANUAL">Anual</option>
                <option value="NENHUMA">Única (Não repete)</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="startDate">Data de Início do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className={styles.footer} style={{ marginTop: '2rem' }}>
            <button type="submit" className={styles.submitBtn}>
              Criar Contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

