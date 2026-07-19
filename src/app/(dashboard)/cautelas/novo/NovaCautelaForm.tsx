"use client";

import React, { useState } from "react";
import { assignEquipment } from "@/actions/equipmentActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Package, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmployeeOption {
  id: string;
  firstName: string | null;
  cpf: string;
  user: {
    name: string;
  } | null;
  roleTitle: string;
}

interface ProductOption {
  id: string;
  name: string;
  category: string | null;
  modelType: string | null;
  size: string | null;
  quantity: number;
  unit: string;
}

interface SelectedItem {
  key: number;
  productId: string;
  quantity: number;
  observations: string;
  searchTerm: string;
  showDropdown: boolean;
}

export default function NovaCautelaForm({
  funcionarios,
  produtos,
}: {
  funcionarios: EmployeeOption[];
  produtos: ProductOption[];
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [items, setItems] = useState<SelectedItem[]>([
    { key: 1, productId: "", quantity: 1, observations: "", searchTerm: "", showDropdown: false }
  ]);

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);
    try {
      await assignEquipment(formData);
      router.push("/cautelas");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar salvar a entrega.");
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems(prevItems => {
      const maxKey = prevItems.reduce((max, item) => Math.max(max, item.key), 0);
      return [
        ...prevItems,
        { key: maxKey + 1, productId: "", quantity: 1, observations: "", searchTerm: "", showDropdown: false }
      ];
    });
  };

  const removeItem = (key: number) => {
    setItems(prevItems => {
      if (prevItems.length > 1) {
        return prevItems.filter(item => item.key !== key);
      }
      return prevItems;
    });
  };

  const updateItem = (key: number, field: keyof SelectedItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item => (item.key === key ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/cautelas" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Registrar Retirada de Material</h1>
        <p className={styles.subtitle}>Atribua um kit completo de uniformes, ferramentas ou consumíveis a um funcionário.</p>
      </div>

      <div className={styles.card}>
        <form action={handleSubmit} className={styles.form}>
          {error && (
            <div ref={errorRef} style={{ background: '#fdedec', color: '#c0392b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e74c3c', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <h3 className={styles.sectionTitle}>Beneficiário</h3>
          <div className={styles.formRow} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="employeeId">Selecione o Funcionário <span style={{ color: '#e74c3c' }}>*</span></label>
              <select 
                id="employeeId" 
                name="employeeId" 
                required 
                style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%' }}
              >
                <option value="">-- Selecione o Terceirizado --</option>
                {funcionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.user?.name || f.firstName} (CPF: {f.cpf})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Materiais Entregues</h3>
            <button 
              type="button" 
              onClick={addItem}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: '#003366', 
                color: 'white', 
                border: 'none', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <Plus size={14} /> Adicionar Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {items.map((item, index) => {
              // Filtrar produtos de acordo com o texto digitado na pesquisa
              const filteredProducts = produtos.filter(p => 
                p.name.toLowerCase().includes(item.searchTerm.toLowerCase()) ||
                (p.category && p.category.toLowerCase().includes(item.searchTerm.toLowerCase()))
              );

              return (
                <div 
                  key={item.key} 
                  style={{ 
                    background: '#fcfcfc', 
                    border: '1px solid #eee', 
                    padding: '1.2rem', 
                    borderRadius: '8px', 
                    position: 'relative' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#003366', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={14} /> Material #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeItem(item.key)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#c0392b', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className={styles.formRow}>
                    {/* Campo com Autocomplete */}
                    <div className={styles.inputGroup} style={{ flex: 2, position: 'relative' }}>
                      <label>Pesquisar Produto <span style={{ color: '#e74c3c' }}>*</span></label>
                      <input 
                        type="text" 
                        placeholder="Digite o nome ou a categoria do produto..."
                        value={item.searchTerm}
                        onChange={(e) => {
                          updateItem(item.key, "searchTerm", e.target.value);
                          updateItem(item.key, "showDropdown", true);
                          updateItem(item.key, "productId", ""); // Limpa o ID caso digite
                        }}
                        onFocus={() => updateItem(item.key, "showDropdown", true)}
                        onBlur={() => updateItem(item.key, "showDropdown", false)}
                        style={{ 
                          width: '100%', 
                          padding: '0.95rem', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd', 
                          background: '#fafafa' 
                        }}
                      />
                      <input type="hidden" name="productId" value={item.productId} required />

                      {/* Dropdown Flutuante */}
                      {item.showDropdown && (
                        <div 
                          onMouseDown={(e) => e.preventDefault()} // Impede o input de perder o foco e fechar antes de processar o clique
                          style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            backgroundColor: 'white', 
                            border: '1px solid #ddd', 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
                            zIndex: 100, 
                            maxHeight: '220px', 
                            overflowY: 'auto',
                            marginTop: '4px'
                          }}
                        >
                          {filteredProducts.length === 0 ? (
                            <div style={{ padding: '12px', color: '#999', fontSize: '0.9rem', textAlign: 'center' }}>
                              Nenhum material correspondente
                            </div>
                          ) : (
                            filteredProducts.map(p => (
                              <div 
                                key={p.id} 
                                onClick={() => {
                                  updateItem(item.key, "productId", p.id);
                                  updateItem(item.key, "searchTerm", `${p.name} (${p.category || 'Outro'})`);
                                  updateItem(item.key, "showDropdown", false);
                                }}
                                style={{ 
                                  padding: '10px 12px', 
                                  cursor: 'pointer', 
                                  borderBottom: '1px solid #f5f5f5',
                                  fontSize: '0.9rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <div>
                                  <strong style={{ color: '#333' }}>{p.name}</strong>
                                  <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '6px' }}>
                                    {[p.category, p.modelType, p.size ? `Tam: ${p.size}` : ''].filter(Boolean).join(' | ')}
                                  </span>
                                </div>
                                <span style={{ fontWeight: 600, color: '#003366', fontSize: '0.85rem' }}>
                                  Estoque: {p.quantity} {p.unit}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                      <label>Quantidade <span style={{ color: '#e74c3c' }}>*</span></label>
                      <input 
                        type="number" 
                        name="quantity" 
                        required 
                        value={item.quantity}
                        min="1" 
                        onChange={(e) => updateItem(item.key, "quantity", parseInt(e.target.value, 10))}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup} style={{ marginTop: '0.8rem' }}>
                    <label>Observação de Entrega <span style={{ fontSize: '0.8rem', color: '#999' }}>(Opcional)</span></label>
                    <input 
                      type="text" 
                      name="observations" 
                      maxLength={250} 
                      value={item.observations}
                      onChange={(e) => updateItem(item.key, "observations", e.target.value)}
                      placeholder="Ex: Novo, embalado ou com avaria leve..." 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.footer} style={{ marginTop: '2rem' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Processando..." : "Confirmar Retirada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
