import { prisma } from "@/lib/prisma";
import { saveTemplate } from "@/actions/legalActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, Save, Info } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditTemplatePage({
  params,
}: {
  params: { type: string };
}) {
  const { type } = params;

  const template = await prisma.documentTemplate.findUnique({
    where: { type }
  });

  if (!template) {
    return notFound();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/juridico" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Modelo de Documento</h1>
        <p className={styles.subtitle}>Modifique a redação do documento e salve as alterações.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Formulário de Edição */}
        <div className={styles.card}>
          <form action={saveTemplate} className={styles.form}>
            <input type="hidden" name="id" value={template.id} />

            <div className={styles.inputGroup}>
              <label htmlFor="title">Título do Documento <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                defaultValue={template.title} 
                required 
              />
            </div>

            <div className={styles.inputGroup} style={{ marginTop: '1.2rem' }}>
              <label htmlFor="content">Conteúdo do Modelo <span style={{ color: '#e74c3c' }}>*</span></label>
              <textarea 
                id="content" 
                name="content" 
                defaultValue={template.content} 
                required 
                rows={18}
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: '1px solid #ddd', 
                  fontFamily: 'monospace', 
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  background: '#fafafa'
                }}
              />
            </div>

            <div className={styles.footer} style={{ marginTop: '2rem' }}>
              <button 
                type="submit" 
                className={styles.submitBtn}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> Salvar Modelo
              </button>
            </div>
          </form>
        </div>

        {/* Guia de Placeholders */}
        <div 
          style={{ 
            background: 'white', 
            borderRadius: '10px', 
            padding: '1.5rem', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
            border: '1px solid #eee' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#003366', marginBottom: '1rem' }}>
            <Info size={20} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Placeholders</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.4', marginBottom: '1.2rem' }}>
            Ao gerar documentos, estas tags entre chaves duplas serão substituídas automaticamente pelos dados reais correspondentes:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#e74c3c' }}>
                {"{{nome_funcionario}}"}
              </code>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>Nome completo do funcionário/terceirizado.</div>
            </div>

            <div>
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#e74c3c' }}>
                {"{{cpf_funcionario}}"}
              </code>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>CPF cadastrado do funcionário.</div>
            </div>

            <div>
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#e74c3c' }}>
                {"{{cargo_funcionario}}"}
              </code>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>Cargo ou título da função do funcionário.</div>
            </div>

            <div>
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#e74c3c' }}>
                {"{{lista_itens}}"}
              </code>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>Lista dos materiais/equipamentos entregues (apenas tipo RETIRADA).</div>
            </div>

            <div>
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#e74c3c' }}>
                {"{{data}}"}
              </code>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px' }}>Data corrente em formato extenso (Ex: 16 de Julho de 2026).</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
