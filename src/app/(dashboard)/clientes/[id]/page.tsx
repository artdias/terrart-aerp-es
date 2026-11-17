import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Briefcase,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import styles from "../novo/novoCliente.module.css";
import WhatsAppButton from "@/components/WhatsAppButton";

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      supervisor: { include: { user: { select: { name: true } } } },
      workplaces: true,
      contracts: true,
      invoices: {
        where: { status: { not: "CANCELED" } },
        orderBy: { dueDate: "desc" },
        take: 6
      },
      documents: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!client || client.deleted) {
    return notFound();
  }

  const dateCreated = new Date(client.createdAt).toLocaleDateString("pt-BR");
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  return (
    <div className={styles.container}>
      {/* Header com botão de voltar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link 
            href="/clientes" 
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#f0f4f8",
              color: "#333",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#002244", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={24} color="#003366" />
              {client.companyName}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#666" }}>
              CNPJ: {client.cnpj} • Cadastrado em {dateCreated}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            href={`/clientes/${client.id}/notas`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#0284c7",
              color: "white",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "0.88rem",
              fontWeight: 600
            }}
          >
            <Receipt size={16} />
            Financeiro de Notas
          </Link>
          <Link 
            href={`/clientes/${client.id}/editar`} 
            style={{
              background: "#f39c12",
              color: "white",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "0.88rem",
              fontWeight: 600,
              transition: "background 0.2s"
            }}
          >
            Editar Cadastro
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Coluna Esquerda - Informações Detalhadas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Card: Dados de Contato e Gerais */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={18} color="#003366" /> Informações Gerais
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>NOME FANTASIA</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.name || "Não informado"}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>TELEFONE COMERCIAL</strong>
                <div style={{ fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Phone size={14} color="#888" /> {client.phone || "Não informado"}
                  </span>
                  {client.phone && <WhatsAppButton phone={client.phone} name={client.companyName} size="sm" />}
                </div>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>CELULAR / WHATSAPP</strong>
                <div style={{ fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Phone size={14} color="#888" /> {client.cellphone || "Não informado"}
                  </span>
                  {client.cellphone && <WhatsAppButton phone={client.cellphone} name={client.companyName} size="sm" />}
                </div>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>EMAIL PRINCIPAL</strong>
                <span style={{ fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={14} color="#888" /> {client.email || "Não informado"}
                </span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>EMAIL SECUNDÁRIO</strong>
                <span style={{ fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={14} color="#888" /> {client.email2 || "Não informado"}
                </span>
              </div>
            </div>

            {client.observations && (
              <div style={{ marginTop: "16px", borderTop: "1px solid #f5f5f5", paddingTop: "12px" }}>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>OBSERVAÇÕES</strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#555", lineHeight: "1.4" }}>{client.observations}</p>
              </div>
            )}
          </div>

          {/* Card: Endereço Operacional */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={18} color="#003366" /> Endereço e Instalações
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>LOGRADOURO</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.address}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>CIDADE / UF</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.city || "Não informado"} - {client.state || "UF"}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>CEP</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.cep || "Não informado"}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>ÁREA TOTAL CONTRATADA</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.totalArea || "Não informado"}</span>
              </div>
            </div>
          </div>

          {/* Card: Postos de Trabalho Ativos (Workplaces) */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Briefcase size={18} color="#003366" /> Postos de Trabalho Operacionais
            </h3>
            {client.workplaces.length === 0 ? (
              <p style={{ margin: 0, color: "#888", fontSize: "0.85rem", fontStyle: "italic" }}>
                Nenhum posto de trabalho cadastrado para este cliente.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {client.workplaces.map((w) => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", border: "1px solid #eef2f6", borderRadius: "6px" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "0.9rem", color: "#1e293b" }}>{w.name}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>{w.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita - Notas Fiscais, Representante Legal e Contratos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Card: Financeiro de Notas do Cliente */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #dbeafe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "6px", color: "#003366" }}>
                <Receipt size={18} color="#0284c7" /> Financeiro de Notas
              </h3>
              <Link
                href={`/clientes/${client.id}/notas`}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#0284c7",
                  textDecoration: "none"
                }}
              >
                Gerenciar / Importar →
              </Link>
            </div>

            {client.invoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: "0.84rem" }}>
                  Nenhuma nota fiscal importada para este cliente ainda.
                </p>
                <Link
                  href={`/clientes/${client.id}/notas`}
                  style={{
                    display: "inline-block",
                    background: "#0284c7",
                    color: "white",
                    textDecoration: "none",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600
                  }}
                >
                  + Importar Nota do Mês
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {client.invoices.map((inv) => {
                  const due = new Date(inv.dueDate);
                  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 0, 0, 0);
                  const isPaid = inv.status === "PAID";
                  const isOverdue = !isPaid && dueMidnight < todayMidnight;

                  return (
                    <Link
                      key={inv.id}
                      href={`/clientes/${client.id}/notas`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 12px",
                        background: isOverdue ? "#fff5f5" : isPaid ? "#f0fdf4" : "#f8fafc",
                        border: `1px solid ${isOverdue ? "#fecaca" : isPaid ? "#bbf7d0" : "#e2e8f0"}`,
                        borderRadius: "6px",
                        textDecoration: "none"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                          {inv.description || "Nota Fiscal"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                          Pagto: {due.toLocaleDateString("pt-BR")} •{" "}
                          <strong>{inv.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                        </div>
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: isPaid ? "#15803d" : isOverdue ? "#b91c1c" : "#b45309"
                        }}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 size={13} /> Pago
                          </>
                        ) : isOverdue ? (
                          <>
                            <AlertTriangle size={13} /> Não pago
                          </>
                        ) : (
                          <>
                            <Clock size={13} /> No prazo
                          </>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Card: Representante Legal e Supervisão */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={18} color="#003366" /> Representante Legal & Supervisão
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>GESTOR RESPONSÁVEL (CLIENTE)</strong>
                <span style={{ fontSize: "0.9rem", color: "#333", fontWeight: 600 }}>{client.managerName || "Não cadastrado"}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>CONTATO DO GESTOR</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.managerContact || "Não cadastrado"}</span>
              </div>
              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#003366" }}>SUPERVISOR RESPONSÁVEL (SISTEMA)</strong>
                {client.supervisor ? (
                  <div style={{ marginTop: "4px" }}>
                    <span style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: 700, display: "block" }}>
                      {client.supervisor.user?.name || `${client.supervisor.firstName || ""} ${client.supervisor.lastName || ""}`.trim()}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "#475569" }}>
                      Tel: {client.supervisor.phone || "Sem telefone cadastrado"}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.9rem", color: "#888" }}>Não selecionado</span>
                )}
              </div>
            </div>
          </div>

          {/* Card: Documentos Emitidos / Contratos */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={18} color="#003366" /> Documentos e Contratos
            </h3>
            {client.documents.length === 0 ? (
              <p style={{ margin: 0, color: "#888", fontSize: "0.85rem", fontStyle: "italic" }}>
                Nenhum documento gerado para o jurídico deste cliente.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {client.documents.map((doc) => (
                  <Link 
                    key={doc.id}
                    href={`/juridico/documento/${doc.id}`}
                    style={{
                      display: "block",
                      padding: "8px 12px",
                      background: "#f0f4f8",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      color: "#003366",
                      fontWeight: 600,
                      border: "1px solid #d0dfef"
                    }}
                  >
                    📄 {doc.title}
                    <span style={{ display: "block", fontSize: "0.72rem", color: "#666", fontWeight: "normal", marginTop: "2px" }}>
                      Status: {doc.status === "SIGNED" ? "✅ Assinado" : "⏳ Pendente"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
