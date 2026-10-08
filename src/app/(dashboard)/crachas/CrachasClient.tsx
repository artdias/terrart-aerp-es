"use client";

import React, { useState } from "react";
import { QrCode, Search, ExternalLink, UserCheck } from "lucide-react";
import styles from "../clientes/clientes.module.css";
import BadgeModal from "@/components/BadgeModal";
import Link from "next/link";

export interface BadgeItem {
  id: string;
  type: "employee" | "user";
  name: string;
  roleTitle: string;
  department: string;
  badgeCode: string;
  photoUrl?: string | null;
  status: string;
  cpf?: string | null;
  clientName?: string | null;
  clientLogoUrl?: string | null;
}

interface CrachasClientProps {
  initialItems: BadgeItem[];
}

export default function CrachasClient({ initialItems }: CrachasClientProps) {
  const [items] = useState<BadgeItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "employee" | "user">("todos");
  const [deptFilter, setDeptFilter] = useState("todos");
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  // Lista de departamentos únicos para o filtro
  const departments = Array.from(new Set(items.map(i => i.department).filter(Boolean)));

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.badgeCode.toLowerCase().includes(search.toLowerCase()) ||
      item.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "todos" || item.type === typeFilter;
    const matchesDept = deptFilter === "todos" || item.department === deptFilter;

    return matchesSearch && matchesType && matchesDept;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <QrCode size={28} color="#2563eb" /> Autenticação & QR Code de Funcionários
          </h1>
          <p className={styles.subtitle}>
            Visualize, baixe ou imprima o QR Code de verificação permanente individual dos colaboradores.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        alignItems: "center",
        background: "white",
        padding: "1rem",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid #eee"
      }}>
        {/* Pesquisa */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Pesquisar por nome, código (ex: TI-7492), setor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.9rem"
            }}
          />
        </div>

        {/* Filtro por Tipo */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "0.9rem",
            background: "white",
            fontWeight: 600
          }}
        >
          <option value="todos">Todos os Registros</option>
          <option value="employee">Apenas Funcionários</option>
          <option value="user">Apenas Usuários de Sistema</option>
        </select>

        {/* Filtro por Setor */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "0.9rem",
            background: "white",
            fontWeight: 600
          }}
        >
          <option value="todos">Todos os Setores</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Tabela de QR Codes */}
      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Tipo</th>
              <th>Setor / Departamento</th>
              <th>Código de Registro</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  Nenhum registro encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#f1f5f9",
                        border: "2px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <UserCheck size={22} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#002244", fontSize: "0.95rem" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          {item.roleTitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: item.type === "employee" ? "#eff6ff" : "#fef3c7",
                      color: item.type === "employee" ? "#1d4ed8" : "#d97706"
                    }}>
                      {item.type === "employee" ? "Funcionário" : "Usuário Sistema"}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      background: "#f1f5f9",
                      color: "#334155"
                    }}>
                      {item.department}
                    </span>
                  </td>
                  <td>
                    <code style={{
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      background: "#002244",
                      color: "#60a5fa",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontFamily: "monospace",
                      letterSpacing: "0.5px"
                    }}>
                      {item.badgeCode}
                    </code>
                  </td>
                  <td>
                    <span style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: item.status === "Ativo" ? "#16a34a" : "#dc2626"
                    }}>
                      ● {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        onClick={() => setSelectedBadge(item)}
                        style={{
                          background: "#002244",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <QrCode size={15} /> Ver QR Code
                      </button>

                      <Link
                        href={`/validar/${encodeURIComponent(item.badgeCode)}`}
                        target="_blank"
                        style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          border: "1px solid #cbd5e1"
                        }}
                        title="Testar página pública de autenticação"
                      >
                        <ExternalLink size={14} /> Validar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de QR Code de Verificação Fixo/Imutável */}
      {selectedBadge && (
        <BadgeModal
          isOpen={!!selectedBadge}
          onClose={() => setSelectedBadge(null)}
          id={selectedBadge.id}
          type={selectedBadge.type}
          name={selectedBadge.name}
          roleTitle={selectedBadge.roleTitle}
          department={selectedBadge.department}
          badgeCode={selectedBadge.badgeCode}
          photoUrl={selectedBadge.photoUrl}
        />
      )}
    </div>
  );
}
