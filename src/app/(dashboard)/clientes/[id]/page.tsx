import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, User, Phone, Mail, FileText, Briefcase, Calendar } from "lucide-react";
import styles from "../novo/novoCliente.module.css";

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      workplaces: true,
      contracts: true,
      documents: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!client || client.deleted) {
    return notFound();
  }

  const dateCreated = new Date(client.createdAt).toLocaleDateString("pt-BR");

  return (
    <div className={styles.container}>
      {/* Header com botão de voltar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
                <span style={{ fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Phone size={14} color="#888" /> {client.phone || "Não informado"}
                </span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>CELULAR / WHATSAPP</strong>
                <span style={{ fontSize: "0.9rem", color: "#333", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Phone size={14} color="#888" /> {client.cellphone || "Não informado"}
                </span>
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

        {/* Coluna Direita - Representante Legal e Contratos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Card: Representante Legal */}
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={18} color="#003366" /> Representante Legal
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>NOME COMPLETO</strong>
                <span style={{ fontSize: "0.9rem", color: "#333", fontWeight: 600 }}>{client.managerName || "Não cadastrado"}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.75rem", color: "#777" }}>CONTATO DIRETO</strong>
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{client.managerContact || "Não cadastrado"}</span>
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
