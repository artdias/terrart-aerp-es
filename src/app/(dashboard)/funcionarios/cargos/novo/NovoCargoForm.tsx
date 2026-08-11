"use client";

import { createRole } from "@/actions/roleActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NovoCargoForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await createRole(formData);
      if (result?.error) {
        setError(result.error);
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
      router.push("/funcionarios/cargos");
      router.refresh();
    } catch (err: any) {
      setError("Ocorreu um erro ao tentar salvar o cargo.");
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
        <Link href="/funcionarios/cargos" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Cadastrar Cargo</h1>
        <p className={styles.subtitle}>Preencha as informações do novo cargo.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div ref={errorRef} style={{ background: '#fdedec', color: '#c0392b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e74c3c', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              {error}
            </div>
          )}
          
          <h3 className={styles.sectionTitle}>Dados do Cargo</h3>
          
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="name">Nome do Cargo <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                placeholder="Ex: Porteiro, Zelador, Recepcionista" 
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="description">Descrição <span style={{ fontSize: '0.8rem', color: '#999' }}>(Opcional)</span></label>
              <textarea 
                id="description" 
                name="description" 
                rows={3}
                placeholder="Breve descrição das atividades deste cargo"
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Cargo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
