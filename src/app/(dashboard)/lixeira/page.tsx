import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trash2, RotateCcw, Trash, AlertTriangle, Building2, User, Package } from "lucide-react";
import Link from "next/link";
import styles from "../clientes/clientes.module.css";
import ActionButtons from "./ActionButtons";

export default async function LixeiraPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const activeTab = searchParams?.tab || "clientes";

  // Verificação de permissões modulares
  const isAdmin = user.role === "ADMIN";
  const canSeeClients = isAdmin || user.permissions?.allowClientes;
  const canSeeEmployees = isAdmin || user.permissions?.allowFuncionarios;
  const canSeeProducts = isAdmin || user.permissions?.allowEstoque;

  // Redireciona caso o usuário não tenha permissão de ver o módulo ativo
  if (activeTab === "clientes" && !canSeeClients) redirect("/");
  if (activeTab === "funcionarios" && !canSeeEmployees) redirect("/");
  if (activeTab === "estoque" && !canSeeProducts) redirect("/");

  // Consultar itens apagados conforme a aba ativa
  let deletedClients: any[] = [];
  let deletedEmployees: any[] = [];
  let deletedProducts: any[] = [];

  if (activeTab === "clientes" && canSeeClients) {
    deletedClients = await prisma.client.findMany({
      where: { deleted: true },
      orderBy: { updatedAt: "desc" }
    });
  } else if (activeTab === "funcionarios" && canSeeEmployees) {
    deletedEmployees = await prisma.employee.findMany({
      where: { deleted: true },
      orderBy: { updatedAt: "desc" }
    });
  } else if (activeTab === "estoque" && canSeeProducts) {
    deletedProducts = await prisma.product.findMany({
      where: { deleted: true },
      orderBy: { updatedAt: "desc" }
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Trash2 size={28} color="#7f8c8d" />
            Lixeira de Registros
          </h1>
          <p className={styles.subtitle}>
            Recupere ou exclua permanentemente cadastros e itens removidos do sistema.
          </p>
        </div>
      </div>

      {/* Navegação por Abas (Tabs) */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
        {canSeeClients && (
          <Link 
            href="/lixeira?tab=clientes"
            style={{
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.88rem",
              textDecoration: "none",
              background: activeTab === "clientes" ? "#003366" : "transparent",
              color: activeTab === "clientes" ? "white" : "#666"
            }}
          >
            Clientes
          </Link>
        )}
        {canSeeEmployees && (
          <Link 
            href="/lixeira?tab=funcionarios"
            style={{
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.88rem",
              textDecoration: "none",
              background: activeTab === "funcionarios" ? "#003366" : "transparent",
              color: activeTab === "funcionarios" ? "white" : "#666"
            }}
          >
            Funcionários
          </Link>
        )}
        {canSeeProducts && (
          <Link 
            href="/lixeira?tab=estoque"
            style={{
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.88rem",
              textDecoration: "none",
              background: activeTab === "estoque" ? "#003366" : "transparent",
              color: activeTab === "estoque" ? "white" : "#666"
            }}
          >
            Estoque (Inventário)
          </Link>
        )}
      </div>

      {/* Tabela de Visualização de Itens Removidos */}
      <div className={styles.tableContainer} style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        
        {/* Aba Clientes */}
        {activeTab === "clientes" && (
          deletedClients.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#888", fontStyle: "italic" }}>
              Nenhum cliente na lixeira.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Razão Social</th>
                  <th>CNPJ</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {deletedClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                        <Building2 size={16} color="#666" />
                        {client.companyName}
                      </div>
                    </td>
                    <td>{client.cnpj}</td>
                    <td>
                      <ActionButtons id={client.id} type="CLIENT" name={client.companyName} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* Aba Funcionários */}
        {activeTab === "funcionarios" && (
          deletedEmployees.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#888", fontStyle: "italic" }}>
              Nenhum funcionário na lixeira.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>CPF / Cargo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {deletedEmployees.map((emp) => {
                  const fullName = `${emp.firstName} ${emp.lastName || ""}`.trim();
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                          <User size={16} color="#666" />
                          {fullName}
                        </div>
                      </td>
                      <td>{emp.cpf} • {emp.roleTitle}</td>
                      <td>
                        <ActionButtons id={emp.id} type="EMPLOYEE" name={fullName} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* Aba Estoque */}
        {activeTab === "estoque" && (
          deletedProducts.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#888", fontStyle: "italic" }}>
              Nenhum produto de estoque na lixeira.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Especificação / Quantidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {deletedProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                        <Package size={16} color="#666" />
                        {prod.name}
                      </div>
                    </td>
                    <td>{prod.category} • {prod.quantity} {prod.unit}</td>
                    <td>
                      <ActionButtons id={prod.id} type="PRODUCT" name={prod.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
