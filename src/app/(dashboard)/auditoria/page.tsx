import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Download, ShieldAlert, Calendar, User, Activity } from "lucide-react";
import styles from "../clientes/clientes.module.css";
import Link from "next/link";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { search?: string; actionType?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // Trava rígida de segurança: Apenas o administrador master (admin) visualiza auditoria
  if (session.user.email !== "admin") {
    redirect("/");
  }

  const search = searchParams?.search || "";
  const actionType = searchParams?.actionType || "";

  // Buscar logs do banco de dados filtrados
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userName: { contains: search } },
        { details: { contains: search } }
      ],
      action: actionType ? { equals: actionType } : undefined
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Buscar todos os tipos de ações únicas para o filtro select dropdown
  const uniqueActions = await prisma.auditLog.groupBy({
    by: ["action"]
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <ShieldAlert size={28} color="#c0392b" />
            Auditoria e Logs do Sistema
          </h1>
          <p className={styles.subtitle}>
            Histórico imutável de todas as movimentações, inclusões e exclusões de recursos.
          </p>
        </div>

        {/* Botão de Exportação para Excel/CSV */}
        <a 
          href="/api/audit/export" 
          download
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#27ae60",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "0.88rem",
            fontWeight: "bold",
            textDecoration: "none",
            boxShadow: "0 4px 10px rgba(39, 174, 96, 0.2)",
            transition: "background 0.2s"
          }}
        >
          <Download size={16} />
          Exportar Logs (CSV)
        </a>
      </div>

      {/* Seção de Filtros */}
      <form method="GET" style={{
        display: "flex",
        gap: "12px",
        background: "white",
        padding: "16px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        marginBottom: "20px"
      }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input 
            type="text" 
            name="search" 
            placeholder="Buscar por usuário ou detalhes..."
            defaultValue={search}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
        </div>

        <select 
          name="actionType" 
          defaultValue={actionType}
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            background: "white",
            fontSize: "0.85rem",
            outline: "none",
            minWidth: "180px"
          }}
        >
          <option value="">Todos os tipos de ação</option>
          {uniqueActions.map((act) => (
            <option key={act.action} value={act.action}>{act.action}</option>
          ))}
        </select>

        <button 
          type="submit" 
          style={{
            background: "#003366",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Filtrar
        </button>

        {(search || actionType) && (
          <Link 
            href="/auditoria" 
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef3f8",
              color: "#333",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              textDecoration: "none"
            }}
          >
            Limpar
          </Link>
        )}
      </form>

      {/* Tabela de Auditoria (Visualização Apenas) */}
      <div className={styles.tableContainer} style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        {logs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#888", fontStyle: "italic" }}>
            Nenhum log de auditoria registrado.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateStr = new Date(log.createdAt).toLocaleString("pt-BR");
                return (
                  <tr key={log.id} style={{ transition: "background 0.2s" }}>
                    <td style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px", color: "#666" }}>
                      <Calendar size={14} />
                      {dateStr}
                    </td>
                    <td style={{ fontWeight: 600, color: "#333" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={14} color="#888" />
                        {log.userName}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: "#e8f4fd",
                        color: "#003366",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: "#555", fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
