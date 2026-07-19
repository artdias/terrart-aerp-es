"use client";

import React, { useState, useEffect } from "react";
import { createClientDocument } from "@/actions/legalActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";

interface ClientOption {
  id: string;
  companyName: string;
  cnpj: string;
  address: string;
}

interface TemplateOption {
  id: string;
  type: string;
  title: string;
  content: string;
}

export default function NovoContratoForm({
  clientes,
  templates,
}: {
  clientes: ClientOption[];
  templates: TemplateOption[];
}) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Pre-selecionar o template de cliente ao carregar
  useEffect(() => {
    const clientTemplate = templates.find(t => t.type === "CONTRATO_CLIENTE");
    if (clientTemplate) {
      setSelectedTemplateId(clientTemplate.id);
    }
  }, [templates]);

  // Atualizar título e conteúdo ao mudar cliente ou modelo
  useEffect(() => {
    if (!selectedClientId || !selectedTemplateId) {
      setTitle("");
      setContent("");
      return;
    }

    const client = clientes.find(c => c.id === selectedClientId);
    const template = templates.find(t => t.id === selectedTemplateId);

    if (client && template) {
      const dateFormatted = new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const prefilledTitle = `${template.title} - ${client.companyName}`;
      const prefilledContent = template.content
        .replace(/\{\{nome_cliente\}\}/g, client.companyName)
        .replace(/\{\{cnpj_cliente\}\}/g, client.cnpj)
        .replace(/\{\{endereco_cliente\}\}/g, client.address)
        .replace(/\{\{data\}\}/g, dateFormatted);

      setTitle(prefilledTitle);
      setContent(prefilledContent);
    }
  }, [selectedClientId, selectedTemplateId, clientes, templates]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/juridico" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Emitir Contrato para Cliente</h1>
        <p className={styles.subtitle}>Gere e personalize contratos de prestação de serviços para empresas contratantes.</p>
      </div>

      <div className={styles.card}>
        <form action={createClientDocument} className={styles.form}>
          
          <h3 className={styles.sectionTitle}>Dados de Faturamento e Modelo</h3>
          
          <div className={styles.formRow}>
            {/* Selecionar Cliente */}
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="clientId">Selecione o Cliente <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="clientId"
                name="clientId"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
              >
                <option value="">-- Selecione a Empresa --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName} (CNPJ: {c.cnpj})</option>
                ))}
              </select>
            </div>

            {/* Selecionar Modelo */}
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="templateId">Modelo Base <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                id="templateId"
                required
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dados de Geração do Contrato */}
          {selectedClientId && selectedTemplateId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#27ae60', fontSize: '0.85rem', fontWeight: 600 }}>
                <Sparkles size={16} /> Preenchimento automático ativado! Modifique o texto abaixo livremente se necessário.
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="title">Título do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="content">Conteúdo e Cláusulas do Contrato <span style={{ color: '#e74c3c' }}>*</span></label>
                <textarea
                  id="content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={16}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontFamily: 'serif',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    background: '#fff'
                  }}
                />
              </div>
            </div>
          )}

          <div className={styles.footer} style={{ marginTop: '2rem' }}>
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={!selectedClientId}
              style={{
                opacity: !selectedClientId ? 0.6 : 1,
                cursor: !selectedClientId ? 'not-allowed' : 'pointer'
              }}
            >
              Emitir Contrato para Assinatura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

