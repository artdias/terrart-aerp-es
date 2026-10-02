"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Users, Building2, Box, ArrowRight, CheckCircle2 } from "lucide-react";

export interface IncompleteItem {
  id: string;
  type: "EMPLOYEE" | "CLIENT" | "MATERIAL";
  name: string;
  missingFields: string[];
  editUrl: string;
}

interface IncompleteRegistrationsCardProps {
  items: IncompleteItem[];
}

export default function IncompleteRegistrationsCard({ items }: IncompleteRegistrationsCardProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "EMPLOYEE" | "CLIENT" | "MATERIAL">("ALL");

  const employeesCount = items.filter(i => i.type === "EMPLOYEE").length;
  const clientsCount = items.filter(i => i.type === "CLIENT").length;
  const materialsCount = items.filter(i => i.type === "MATERIAL").length;

  const filteredItems = items.filter(item => {
    if (activeTab === "ALL") return true;
    return item.type === activeTab;
  });

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #fee2e2", boxShadow: "0 2px 10px rgba(239, 68, 68, 0.05)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #fecaca", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "#fef2f2", padding: "8px", borderRadius: "8px", color: "#dc2626" }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#991b1b", fontWeight: 700 }}>
              Cadastros Incompletos
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#7f1d1d" }}>
              Identificamos fichas e cadastros que possuem dados essenciais pendentes.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <span style={{ background: "#ef4444", color: "white", fontSize: "0.78rem", fontWeight: 800, padding: "4px 10px", borderRadius: "12px" }}>
            {items.length} {items.length === 1 ? "pendência" : "pendências"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          <CheckCircle2 size={32} style={{ color: "#16a34a", marginBottom: "8px" }} />
          <h4 style={{ margin: "0 0 4px 0", color: "#15803d", fontSize: "0.95rem" }}>Tudo em dia!</h4>
          <p style={{ margin: 0, color: "#166534", fontSize: "0.82rem" }}>
            Todos os cadastros de colaboradores, clientes e materiais estão completos.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: activeTab === "ALL" ? "#dc2626" : "#e2e8f0",
                background: activeTab === "ALL" ? "#fef2f2" : "#f8fafc",
                color: activeTab === "ALL" ? "#991b1b" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Todos ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("EMPLOYEE")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: activeTab === "EMPLOYEE" ? "#dc2626" : "#e2e8f0",
                background: activeTab === "EMPLOYEE" ? "#fef2f2" : "#f8fafc",
                color: activeTab === "EMPLOYEE" ? "#991b1b" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Users size={14} /> Funcionários ({employeesCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CLIENT")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: activeTab === "CLIENT" ? "#dc2626" : "#e2e8f0",
                background: activeTab === "CLIENT" ? "#fef2f2" : "#f8fafc",
                color: activeTab === "CLIENT" ? "#991b1b" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Building2 size={14} /> Clientes ({clientsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MATERIAL")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: activeTab === "MATERIAL" ? "#dc2626" : "#e2e8f0",
                background: activeTab === "MATERIAL" ? "#fef2f2" : "#f8fafc",
                color: activeTab === "MATERIAL" ? "#991b1b" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Box size={14} /> Materiais ({materialsCount})
            </button>
          </div>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto" }}>
            {filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #fee2e2",
                  background: "#fff5f5"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "6px", borderRadius: "6px", background: "#fecaca", color: "#991b1b" }}>
                    {item.type === "EMPLOYEE" && <Users size={16} />}
                    {item.type === "CLIENT" && <Building2 size={16} />}
                    {item.type === "MATERIAL" && <Box size={16} />}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.85rem", color: "#1e293b" }}>{item.name}</strong>
                      <span style={{ fontSize: "0.68rem", padding: "1px 6px", borderRadius: "4px", background: "#e2e8f0", color: "#475569", fontWeight: 700 }}>
                        {item.type === "EMPLOYEE" ? "Funcionário" : item.type === "CLIENT" ? "Cliente" : "Material"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.72rem", color: "#7f1d1d", fontWeight: 600 }}>Faltando:</span>
                      {item.missingFields.map((field, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            fontSize: "0.7rem",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: 600,
                            border: "1px solid #fca5a5"
                          }}
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={item.editUrl}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#dc2626",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  Completar <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
