import React from "react";
import { updateUser } from "@/actions/userActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, UserPlus, Shield } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { prisma } from "@/lib/prisma";

export default async function EditarUsuarioPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Apenas o administrador master (admin) pode editar usuários
  if (!session?.user || session.user.email !== "admin") {
    redirect("/");
  }

  const userToEdit = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!userToEdit) {
    return notFound();
  }

  // O administrador master padrão não pode ter suas permissões alteradas por esta via
  const isMasterAdmin = userToEdit.email === "admin";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/usuarios" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Usuário</h1>
        <p className={styles.subtitle}>Ajuste as credenciais e o nível de acesso do colaborador.</p>
      </div>

      <div className={styles.card}>
        <form action={updateUser} className={styles.form}>
          <input type="hidden" name="userId" value={userToEdit.id} />

          <h3 className={styles.sectionTitle}>
            <UserPlus size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#003366' }} />
            Dados Cadastrais
          </h3>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="name">Nome do Colaborador <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={userToEdit.name || ""}
                placeholder="Ex: Carlos Silva"
                required
                disabled={isMasterAdmin}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="email">Nome de Usuário (Login) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                id="email"
                name="email"
                defaultValue={userToEdit.email}
                placeholder="Ex: carlos.silva"
                required
                disabled={isMasterAdmin}
              />
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="password">Senha de Acesso (Digite para alterar)</label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Deixe em branco para manter a senha atual"
                required={false}
              />
            </div>
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
            <Shield size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#e67e22' }} />
            Permissões de Módulo
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1.2rem", marginTop: "-0.5rem" }}>
            Selecione quais módulos este usuário terá permissão para visualizar e gerenciar.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
            background: "#fdfdfd",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #eee",
            marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowClientes" 
                name="allowClientes" 
                defaultChecked={userToEdit.allowClientes}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowClientes" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Clientes</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowFuncionarios" 
                name="allowFuncionarios" 
                defaultChecked={userToEdit.allowFuncionarios}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowFuncionarios" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Funcionários</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowEscalas" 
                name="allowEscalas" 
                defaultChecked={userToEdit.allowEscalas}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowEscalas" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Escalas</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowEstoque" 
                name="allowEstoque" 
                defaultChecked={userToEdit.allowEstoque}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowEstoque" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Estoque</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowCautelas" 
                name="allowCautelas" 
                defaultChecked={userToEdit.allowCautelas}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowCautelas" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Atribuições (Cautelas)</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowFinanceiro" 
                name="allowFinanceiro" 
                defaultChecked={userToEdit.allowFinanceiro}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowFinanceiro" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Financeiro Geral</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowJuridico" 
                name="allowJuridico" 
                defaultChecked={userToEdit.allowJuridico}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowJuridico" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Jurídico</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowFaturamento" 
                name="allowFaturamento" 
                defaultChecked={userToEdit.allowFaturamento}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowFaturamento" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Faturamento Clientes</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowRecepcao" 
                name="allowRecepcao" 
                defaultChecked={userToEdit.allowRecepcao}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowRecepcao" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Recepção</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="allowRelatorios" 
                name="allowRelatorios" 
                defaultChecked={userToEdit.allowRelatorios}
                disabled={isMasterAdmin}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} 
              />
              <label htmlFor="allowRelatorios" style={{ fontSize: "0.9rem", color: "#333", cursor: "pointer", fontWeight: 600 }}>Relatórios</label>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
