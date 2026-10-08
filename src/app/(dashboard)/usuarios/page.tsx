import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users, ShieldAlert, Check, X, Edit2 } from "lucide-react";
import styles from "../clientes/clientes.module.css";
import { deleteUser, toggleUserStatus } from "@/actions/userActions";
import DeleteButton from "@/components/DeleteButton";
import UserStatusToggleButton from "@/components/UserStatusToggleButton";

export default async function UsuariosDashboard() {
  const session = await getServerSession(authOptions);

  // Bloqueio de segurança: apenas o administrador master (admin) acessa
  if (!session?.user || session.user.email !== "admin") {
    redirect("/");
  }

  const loggedUserId = (session.user as any).id;

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Controle de Usuários e Permissões</h1>
          <p className={styles.subtitle}>Gerencie credenciais de login e os privilégios de acesso aos módulos do sistema.</p>
        </div>
        <Link href="/usuarios/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Novo Usuário</span>
        </Link>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome / Funcionário</th>
              <th>Login / Usuário</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Acesso aos Módulos</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const modules = [
                { key: "allowClientes", label: "Clientes" },
                { key: "allowFuncionarios", label: "Funcionários" },
                { key: "allowEscalas", label: "Escalas" },
                { key: "allowEstoque", label: "Estoque" },
                { key: "allowCautelas", label: "Atribuições" },
                { key: "allowFinanceiro", label: "Financeiro" },
                { key: "allowJuridico", label: "Jurídico" },
                { key: "allowFaturamento", label: "Faturamento" },
                { key: "allowRecepcao", label: "Recepção" },
                { key: "allowRelatorios", label: "Relatórios" }
              ];

              const isSelf = u.id === loggedUserId;
              const isAdminMaster = u.email === "admin";
              const isActive = u.active ?? true;

              return (
                <tr key={u.id} style={{ opacity: isActive ? 1 : 0.75, background: isActive ? "transparent" : "#fafafa" }}>
                  <td>
                    <div style={{ fontWeight: 600, color: isActive ? "#002244" : "#64748b" }}>
                      {u.name} {isSelf && <span style={{ fontSize: "0.75rem", color: "#3498db", fontWeight: "normal" }}>(você)</span>}
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.85rem", background: "#f5f5f5", padding: "2px 6px", borderRadius: "4px" }}>
                      {u.email}
                    </code>
                  </td>
                  <td>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: u.role === "ADMIN" ? "#fcedec" : "#f0f0f0",
                      color: u.role === "ADMIN" ? "#c0392b" : "#555"
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: isActive ? "#eafaf1" : "#fef2f2",
                      color: isActive ? "#27ae60" : "#dc2626",
                      border: `1px solid ${isActive ? "#a3e635" : "#fca5a5"}`
                    }}>
                      {isActive ? "Ativo" : "Inativo (Bloqueado)"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "450px" }}>
                      {isAdminMaster || u.role === "ADMIN" ? (
                        <span style={{ fontSize: "0.8rem", color: "#27ae60", fontWeight: 600 }}>
                          ★ Acesso Total (Administrador)
                        </span>
                      ) : (
                        modules.map((m) => {
                          const hasAccess = (u as any)[m.key];
                          return (
                            <span
                              key={m.key}
                              style={{
                                fontSize: "0.72rem",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: hasAccess ? "#eafaf1" : "#fafafa",
                                color: hasAccess ? "#27ae60" : "#bbb",
                                border: `1px solid ${hasAccess ? "#27ae60" : "#eee"}`
                              }}
                            >
                              {m.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isAdminMaster ? (
                      <span style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>
                        Sistema Master
                      </span>
                    ) : isSelf ? (
                      <span style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>
                        Logado
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", justifyContent: "end", alignItems: "center" }}>
                        <Link 
                          href={`/usuarios/${u.id}/editar`}
                          style={{
                            color: "#003366",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: "#f1f5f9"
                          }}
                          title="Editar Usuário"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <UserStatusToggleButton
                          action={toggleUserStatus}
                          userId={u.id}
                          active={isActive}
                          userName={u.name}
                        />
                        <DeleteButton 
                          action={deleteUser} 
                          id={u.id} 
                          name="userId" 
                          confirmText="Deseja mesmo excluir este usuário?" 
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
