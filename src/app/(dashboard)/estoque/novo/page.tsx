import { createProduct } from "@/actions/inventoryActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NovoProdutoPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/estoque" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Cadastrar Produto no Estoque</h1>
        <p className={styles.subtitle}>Adicione materiais de Limpeza, EPIs, Uniformes ou Ferramentas.</p>
      </div>

      <div className={styles.card}>
        <form action={createProduct} className={styles.form}>
          
          <h3 className={styles.sectionTitle}>Dados do Material</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 2 }}>
              <label htmlFor="name">Nome do Produto * <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 150)</span></label>
              <input type="text" id="name" name="name" required maxLength={150} placeholder="Ex: Uniforme Operacional, Luva Látex, Desinfetante..." />
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="category">Categoria</label>
              <select id="category" name="category" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
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
              <input type="text" id="modelType" name="modelType" maxLength={100} placeholder="Ex: Feminino, Masculino, Manga Longa..." />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="size">Tamanho <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 50)</span></label>
              <input type="text" id="size" name="size" maxLength={50} placeholder="Ex: P, M, G, GG, 40, 42, Único..." />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description">Descrição detalhada <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 500)</span></label>
            <input type="text" id="description" name="description" maxLength={500} placeholder="Ex: Utilizado pela equipe de limpeza de pisos frios." />
          </div>

          <h3 className={styles.sectionTitle}>Controle de Estoque</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="unit">Unidade de Medida</label>
              <select id="unit" name="unit" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="un">Unidade (un)</option>
                <option value="par">Par</option>
                <option value="cx">Caixa (cx)</option>
                <option value="litros">Litros (L)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="pacote">Pacote (pct)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="quantity">Quantidade Atual (Entrada)</label>
              <input type="number" id="quantity" name="quantity" required defaultValue="0" min="0" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="minQuantity">Qtd. Mínima (Alerta)</label>
              <input type="number" id="minQuantity" name="minQuantity" required defaultValue="5" min="0" />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>
  );
}
