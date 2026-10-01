import React from "react";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, ShieldAlert, CheckCircle2, User, Building2, Tag, Calendar, UserCheck } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Sempre busca dados atualizados em tempo real

interface PageProps {
  params: {
    code: string;
  };
}

export default async function ValidarCrachaPage({ params }: PageProps) {
  const codeParam = decodeURIComponent(params.code).trim().toUpperCase();

  // Buscar por badgeCode ou por ID no banco (Funcionário ou Usuário)
  let employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { badgeCode: { equals: codeParam, mode: "insensitive" } },
        { id: codeParam }
      ],
      deleted: false
    },
    include: {
      user: true,
      workplace: { include: { client: true } }
    }
  });

  let user = null;
  if (!employee) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { badgeCode: { equals: codeParam, mode: "insensitive" } },
          { id: codeParam }
        ]
      }
    });
  }

  const found = !!(employee || user);
  const name = employee ? `${employee.firstName} ${employee.lastName || ''}`.trim() : (user?.name || "");
  const roleTitle = employee ? employee.roleTitle : (user?.role === "ADMIN" ? "Administrador de Sistema" : "Usuário do Sistema");
  const department = employee ? (employee.department || "Operacional") : (user?.department || "Administrativo");
  const badgeCode = employee ? (employee.badgeCode || codeParam) : (user?.badgeCode || codeParam);
  const status = employee ? employee.status : "Ativo";
  const photoUrl = employee?.photoUrl || null;
  const cpf = employee?.cpf ? employee.cpf.replace(/(\d{3})\d{3}\d{3}(\d{2})/, "$1.***.***-$2") : null;
  const workplaceName = employee?.workplace?.client?.companyName || employee?.workplace?.name || "Base Operacional";

  const currentDateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        background: "white",
        width: "100%",
        maxWidth: "480px",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Banner Superior da Empresa */}
        <div style={{
          background: "#002244",
          color: "white",
          padding: "24px 20px",
          textAlign: "center",
          borderBottom: "4px solid #3b82f6"
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "1px", marginBottom: "8px" }}>
            <Building2 size={14} color="#60a5fa" />
            <span>TERRART / ARTLUN AERP</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Validação de Crachá</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#93c5fd" }}>Sistema Oficial de Autenticação de Identidade</p>
        </div>

        {/* Corpo com resultado da verificação */}
        <div style={{ padding: "28px 24px" }}>
          {found ? (
            <>
              {/* Card de Status Válido */}
              <div style={{
                background: status === "Ativo" ? "#ecfdf5" : "#fffbebe6",
                border: `2px solid ${status === "Ativo" ? "#10b981" : "#f59e0b"}`,
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "24px"
              }}>
                <div style={{
                  background: status === "Ativo" ? "#10b981" : "#f59e0b",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0
                }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: status === "Ativo" ? "#065f46" : "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span>CRACHÁ AUTÊNTICO E VÁLIDO</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px" }}>
                    Status do Cadastro: <strong style={{ color: status === "Ativo" ? "#059669" : "#d97706" }}>{status}</strong>
                  </div>
                </div>
              </div>

              {/* Informações do Titular do Crachá */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  border: "4px solid #3b82f6",
                  overflow: "hidden",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
                }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={60} color="#94a3b8" />
                  )}
                </div>

                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  {name}
                </h1>
                
                <div style={{ display: "inline-block", background: "#eff6ff", color: "#1d4ed8", padding: "4px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>
                  {roleTitle}
                </div>
              </div>

              {/* Grid de Detalhes */}
              <div style={{
                background: "#f8fafc",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                display: "grid",
                gap: "12px",
                fontSize: "0.9rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Tag size={16} color="#3b82f6" /> Código de Referência:
                  </span>
                  <strong style={{
                    fontFamily: "monospace",
                    background: "#e0f2fe",
                    color: "#0369a1",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.95rem"
                  }}>
                    {badgeCode}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={16} color="#3b82f6" /> Setor / Depto:
                  </span>
                  <strong style={{ color: "#1e293b" }}>{department}</strong>
                </div>

                {cpf && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <UserCheck size={16} color="#3b82f6" /> CPF (Parcial):
                    </span>
                    <strong style={{ color: "#334155", fontFamily: "monospace" }}>{cpf}</strong>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={16} color="#3b82f6" /> Posto / Unidade:
                  </span>
                  <strong style={{ color: "#334155" }}>{workplaceName}</strong>
                </div>
              </div>

              {/* Timestamp de Validação */}
              <div style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "0.75rem",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}>
                <Calendar size={14} color="#94a3b8" />
                <span>Consulta realizada em {currentDateStr}</span>
              </div>
            </>
          ) : (
            /* Card de Erro / Não Encontrado */
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                background: "#fef2f2",
                border: "2px solid #ef4444",
                borderRadius: "50%",
                width: "64px",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
                margin: "0 auto 16px"
              }}>
                <ShieldAlert size={36} />
              </div>

              <h2 style={{ color: "#991b1b", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px" }}>
                Crachá Não Encontrado ou Inválido
              </h2>

              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
                O código de referência <strong style={{ fontFamily: "monospace", color: "#dc2626" }}>"{codeParam}"</strong> não corresponde a nenhum funcionário ou usuário ativo no sistema.
              </p>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "0.8rem", color: "#64748b" }}>
                Se você é o portador deste crachá, solicite ao setor de Recursos Humanos ou Administração a validação do seu cadastro.
              </div>
            </div>
          )}
        </div>

        {/* Rodapé institucional */}
        <div style={{
          background: "#f1f5f9",
          padding: "12px 24px",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#94a3b8",
          borderTop: "1px solid #e2e8f0"
        }}>
          &copy; {new Date().getFullYear()} TERRART / ARTLUN AERP. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
