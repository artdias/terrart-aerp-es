"use client";

import { updateProduct } from "@/actions/inventoryActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ProductType {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  minQuantity: number;
  unit: string;
  category: string | null;
  size: string | null;
  modelType: string | null;
}

export default function EditProdutoForm({ produto }: { produto: ProductType }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await updateProduct(produto.id, formData);
      router.push("/estoque");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao atualizar o produto.");
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
        <Link href={`/estoque`} className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar para o Estoque</span>
        </Link>
        <h1 className={styles.title}>Editar Produto</h1>
        <p className={styles.subtitle}>Altere as informações deste item de estoque.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div ref={errorRef} style={{ background: '#fdedec', color: '#c0392b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e74c3c', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <h3 className={styles.sectionTitle}>Dados do Material</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 2 }}>
              <label htmlFor="name">Nome do Produto * <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 150)</span></label>
              <input type="text" id="name" name="name" required maxLength={150} defaultValue={produto.name} />
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="category">Categoria</label>
              <select id="category" name="category" defaultValue={produto.category || ""} style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">Nenhuma</option>
                <option value="Uniforme">Uniforme</option>
                <option value="EPI">EPI</option>
                <option value="Limpeza">Produto de Limpeza</option>
                <option value="Ferramenta">Ferramenta</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Especificações (Opcional)</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="modelType">Modelo <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 100)</span></label>
              <input type="text" id="modelType" name="modelType" maxLength={100} defaultValue={produto.modelType || ""} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="size">Tamanho <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 50)</span></label>
              <input type="text" id="size" name="size" maxLength={50} defaultValue={produto.size || ""} />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description">Descrição detalhada <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 500)</span></label>
            <input type="text" id="description" name="description" maxLength={500} defaultValue={produto.description || ""} />
          </div>

          <h3 className={styles.sectionTitle}>Controle de Estoque</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="unit">Unidade de Medida</label>
              <select id="unit" name="unit" defaultValue={produto.unit} style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="un">Unidade (un)</option>
                <option value="par">Par</option>
                <option value="cx">Caixa (cx)</option>
                <option value="litros">Litros (L)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="pacote">Pacote (pct)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="quantity">Quantidade Atual (Estoque Central)</label>
              <input type="number" id="quantity" name="quantity" required defaultValue={produto.quantity} min="0" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="minQuantity">Qtd. Mínima (Alerta)</label>
              <input type="number" id="minQuantity" name="minQuantity" required defaultValue={produto.minQuantity} min="0" />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
