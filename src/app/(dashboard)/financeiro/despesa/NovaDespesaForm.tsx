"use client";

import React, { useState } from "react";
import { createExpense } from "@/actions/expenseActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Box, PackagePlus } from "lucide-react";

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  category: string | null;
}

interface NovaDespesaFormProps {
  produtos: ProductOption[];
}

export default function NovaDespesaForm({ produtos }: NovaDespesaFormProps) {
  const [isInventory, setIsInventory] = useState(false);
  const [productType, setProductType] = useState<"EXISTING" | "NEW">("EXISTING");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/financeiro?tab=despesas" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Lançar Nova Despesa</h1>
        <p className={styles.subtitle}>Registre contas, despesas de custeio ou compras de materiais.</p>
      </div>

      <div className={styles.card}>
        <form action={createExpense} className={styles.form} encType="multipart/form-data">
          
          <h3 className={styles.sectionTitle}>Dados Gerais da Despesa</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 2 }}>
              <label htmlFor="description">Descrição / Motivo da Despesa <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="description" 
                name="description" 
                required 
                maxLength={150} 
                placeholder="Ex: Conta de Luz - Julho/2026, Compra de Copos Descartáveis..." 
              />
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="category">Categoria da Despesa <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="category" 
                name="category" 
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
                required 
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="status">Status do Pagamento <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="status" 
                name="status" 
                required
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}
              >
                <option value="PENDING">Pendente (A Pagar)</option>
                <option value="PAID">Pago (Liquidado)</option>
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Anexar Comprovantes</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="bill">Nota Fiscal / Boleto / Fatura <span style={{ fontSize: '0.8rem', color: '#999' }}>(Opcional)</span></label>
              <input 
                type="file" 
                id="bill" 
                name="bill" 
                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="receipt">Comprovante de Pagamento <span style={{ fontSize: '0.8rem', color: '#999' }}>(Opcional)</span></label>
              <input 
                type="file" 
                id="receipt" 
                name="receipt" 
                style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Integração com Estoque */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="isInventoryItem" 
                name="isInventoryItem" 
                value="true" 
                checked={isInventory}
                onChange={(e) => setIsInventory(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isInventoryItem" style={{ fontSize: '1rem', fontWeight: 600, color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box size={18} style={{ color: '#003366' }} />
                Esta despesa refere-se à compra de materiais para o estoque central
              </label>
            </div>

            {isInventory && (
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#444', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="productSelectionType" 
                      checked={productType === "EXISTING"}
                      onChange={() => setProductType("EXISTING")}
                      style={{ cursor: 'pointer' }}
                    />
                    Adicionar a Produto Existente
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#444', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="productSelectionType" 
                      checked={productType === "NEW"}
                      onChange={() => setProductType("NEW")}
                      style={{ cursor: 'pointer' }}
                    />
                    <PackagePlus size={16} /> Cadastrar Novo Produto
                  </label>
                </div>

                {productType === "EXISTING" ? (
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup} style={{ flex: 2 }}>
                      <label htmlFor="productId">Selecione o Produto <span style={{ color: '#e74c3c' }}>*</span></label>
                      <select 
                        id="productId" 
                        name="productId" 
                        required={isInventory}
                        style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
                      >
                        <option value="">-- Selecione o Produto --</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                      <label htmlFor="quantity">Quantidade Comprada <span style={{ color: '#e74c3c' }}>*</span></label>
                      <input 
                        type="number" 
                        id="quantity" 
                        name="quantity" 
                        min="1" 
                        required={isInventory}
                        placeholder="Ex: 50" 
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <input type="hidden" name="productId" value="NEW" />
                    
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup} style={{ flex: 2 }}>
                        <label htmlFor="productName">Nome do Novo Produto <span style={{ color: '#e74c3c' }}>*</span></label>
                        <input 
                          type="text" 
                          id="productName" 
                          name="productName" 
                          required={isInventory && productType === "NEW"}
                          placeholder="Ex: Copo Plástico 200ml, Desinfetante Pinho..." 
                        />
                      </div>
                      
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label htmlFor="productCategory">Categoria</label>
                        <select 
                          id="productCategory" 
                          name="productCategory"
                          style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
                        >
                          <option value="Copa">Copa / Cozinha</option>
                          <option value="Limpeza">Produto de Limpeza</option>
                          <option value="Uniforme">Uniforme</option>
                          <option value="EPI">EPI</option>
                          <option value="Ferramenta">Ferramenta</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="productUnit">Unidade de Medida</label>
                        <select 
                          id="productUnit" 
                          name="productUnit"
                          style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
                        >
                          <option value="un">Unidade (un)</option>
                          <option value="cx">Caixa (cx)</option>
                          <option value="par">Par</option>
                          <option value="litros">Litros (L)</option>
                          <option value="kg">Quilogramas (kg)</option>
                          <option value="pacote">Pacote (pct)</option>
                        </select>
                      </div>

                      <div className={styles.inputGroup}>
                        <label htmlFor="productMinQuantity">Estoque Mínimo (Alerta)</label>
                        <input 
                          type="number" 
                          id="productMinQuantity" 
                          name="productMinQuantity" 
                          defaultValue="5"
                          min="0"
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label htmlFor="quantity">Quantidade Comprada (Inicial) <span style={{ color: '#e74c3c' }}>*</span></label>
                        <input 
                          type="number" 
                          id="quantity" 
                          name="quantity" 
                          min="1" 
                          required={isInventory}
                          placeholder="Ex: 20" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>Lançar Despesa</button>
          </div>
        </form>
      </div>
    </div>
  );
}

