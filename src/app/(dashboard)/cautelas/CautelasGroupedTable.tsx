"use client";

import React, { useState } from "react";
import styles from "../clientes/clientes.module.css";
import { Package, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import ReturnMaterialForm from "./ReturnMaterialForm";

export default function CautelasGroupedTable({ groups, tab }: { groups: any[], tab: string }) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (employeeId: string) => {
    setExpandedRows(prev => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  if (groups.length === 0) {
    return (
      <div className={styles.emptyState} style={{ padding: '3rem', textAlign: 'center', background: 'white', border: '1px solid #eee', borderRadius: '8px' }}>
        Nenhuma atribuição correspondente encontrada nesta aba.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {groups.map(group => {
        const { employee, equipments } = group;
        const isExpanded = expandedRows[employee.id];

        return (
          <div key={employee.id} style={{ border: '1px solid #ddd', borderRadius: '8px', background: 'white', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            {/* Cabeçalho do Funcionário (Linha Clicável) */}
            <div 
              onClick={() => toggleRow(employee.id)}
              style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer', 
                background: isExpanded ? '#f8f9fa' : 'white', 
                transition: 'background 0.2s' 
              }}
            >
              <div>
                <div className={styles.strongText} style={{ fontSize: '1.1rem', color: '#003366', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {employee.user?.name || employee.firstName || "Sem Nome"}
                  <span style={{ fontSize: '0.75rem', background: '#e1e8ed', color: '#34495e', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    {equipments.length} item(s)
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                  CPF: {employee.cpf} | {employee.roleTitle || "Terceirizado"}
                </div>
              </div>
              <div style={{ color: '#003366', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                {isExpanded ? "Ocultar Itens" : "Ver Itens"}
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {/* Tabela de Itens (Gaveta) */}
            {isExpanded && (
              <div style={{ padding: '0', borderTop: '1px solid #eee', background: '#fafafa' }}>
                <table className={styles.table} style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                  <thead style={{ background: '#f5f5f5' }}>
                    <tr>
                      <th style={{ paddingLeft: '20px' }}>Material Entregue (Qtd)</th>
                      <th>Data de Entrega</th>
                      <th>Status Uso</th>
                      <th>Termo Jurídico</th>
                      <th>Histórico / Obs</th>
                      <th style={{ width: '300px' }}>{tab === "ativas" ? "Ações de Baixa" : "Data de Baixa"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipments.map((cautela: any) => (
                      <tr key={cautela.id} style={{ background: 'white' }}>
                        <td style={{ paddingLeft: '20px' }}>
                          <div className={styles.cellWithIcon}>
                            <Package size={16} className={styles.icon} />
                            <div>
                              <div className={styles.strongText}>{cautela.product.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#002244', fontWeight: 600 }}>
                                Retirou {cautela.quantity} {cautela.product.unit}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellWithIcon}>
                            <Clock size={16} className={styles.icon} />
                            {new Date(cautela.borrowedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td>
                          {cautela.status === "EM USO" && (
                            <span style={{ color: '#d35400', fontWeight: 600, background: '#fdebd0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Em Uso</span>
                          )}
                          {cautela.status === "DEVOLVIDO" && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <CheckCircle size={14} /> Devolvido
                            </div>
                          )}
                          {cautela.status === "CONSUMIDO" && (
                            <span style={{ color: '#7f8c8d', fontWeight: 600, background: '#eaeded', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Consumido</span>
                          )}
                          {cautela.status === "DANIFICADO" && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8e44ad', fontWeight: 600, background: '#f5eef8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <AlertTriangle size={14} /> Danificado
                            </div>
                          )}
                          {cautela.status === "PERDIDO" && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#c0392b', fontWeight: 600, background: '#fadbd8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <AlertTriangle size={14} /> Perdido
                            </div>
                          )}
                        </td>
                        <td>
                          {cautela.document ? (
                            cautela.document.status === "SIGNED" ? (
                              <Link 
                                href={`/juridico/documento/${cautela.documentId}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#27ae60', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'underline' }}
                              >
                                <CheckCircle size={14} /> Assinado
                              </Link>
                            ) : (
                              <Link 
                                href={`/assinar/${cautela.documentId}`}
                                target="_blank"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#e67e22', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'underline' }}
                              >
                                <Clock size={14} /> Pendente (Assinar)
                              </Link>
                            )
                          ) : (
                            <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.8rem' }}>Sem Termo</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#555', maxWidth: '160px', wordBreak: 'break-word' }}>
                            {cautela.observations || "-"}
                          </div>
                        </td>
                        <td>
                          {cautela.status === "EM USO" ? (
                            <ReturnMaterialForm equipmentId={cautela.id} />
                          ) : (
                            <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.85rem' }}>
                              Baixa em {cautela.returnedAt ? new Date(cautela.returnedAt).toLocaleDateString('pt-BR') : "-"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
