import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { 
  Plus, 
  Calendar, 
  ConciergeBell, 
  MessageSquare, 
  User, 
  Building, 
  Clock, 
  CheckCircle, 
  Lock, 
  Unlock, 
  PhoneCall, 
  Trash2,
  Phone,
  BookmarkCheck
} from "lucide-react";
import styles from "../clientes/clientes.module.css";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import { updateEventStatus, createPhoneMessage, resolvePhoneMessage } from "@/actions/receptionActions";
import { redirect } from "next/navigation";
import NovoRecadoForm from "./NovoRecadoForm";

export default async function RecepcaoDashboard({
  searchParams,
}: {
  searchParams: { tab?: string; search?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowRecepcao) {
    redirect("/");
  }

  const loggedUserId = (session?.user as any)?.id;

  const tab = searchParams?.tab || "agenda";
  const search = searchParams?.search || "";
  const statusFilter = searchParams?.status || "";

  // 1. Condições de busca para a Agenda Geral (com regras de privacidade)
  const meetingConditions: any = {
    OR: [
      { creatorId: loggedUserId },
      { participants: { some: { id: loggedUserId } } },
      { privacy: "PUBLICO" }
    ]
  };

  if (search) {
    meetingConditions.AND = [
      {
        OR: [
          { title: { contains: search } },
          { participants: { some: { name: { contains: search } } } },
          { client: { companyName: { contains: search } } },
          { employee: { firstName: { contains: search } } },
          { employee: { lastName: { contains: search } } }
        ]
      }
    ];
  }

  if (statusFilter) {
    if (meetingConditions.AND) {
      meetingConditions.AND.push({ status: statusFilter });
    } else {
      meetingConditions.AND = [{ status: statusFilter }];
    }
  }

  // 2. Condições de busca para Recados
  const messageConditions: any = {
    status: "PENDENTE"
  };
  if (search) {
    messageConditions.OR = [
      { recipientName: { contains: search } },
      { senderName: { contains: search } },
      { message: { contains: search } }
    ];
  }

  // Query das reuniões e recados no banco
  const meetings = await prisma.scheduleEvent.findMany({
    where: meetingConditions,
    include: {
      creator: true,
      participants: true,
      client: true,
      employee: { include: { user: true } }
    },
    orderBy: { startAt: "asc" }
  });

  const phoneMessages = await prisma.phoneMessage.findMany({
    where: messageConditions,
    include: { recipientUser: true },
    orderBy: { createdAt: "desc" }
  });

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" }
  });

  // Cálculos de KPIs estatísticos
  const totalEventosPendente = meetings.filter(m => m.status === "PENDENTE").length;
  const totalRecadosPendente = phoneMessages.filter(p => p.status === "PENDENTE").length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recepção e Portaria</h1>
          <p className={styles.subtitle}>Gerencie recados telefônicos, agendamento de reuniões e adimplência de agendas corporativas.</p>
        </div>
        <Link href="/recepcao/novo-agendamento" className={styles.addButton}>
          <Plus size={20} />
          <span>Agendar Reunião</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
          <div style={{ color: "#777", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={16} style={{ color: "#003366" }} /> Reuniões Pendentes
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#003366" }}>
            {totalEventosPendente}
          </div>
        </div>

        <div style={{ background: "white", padding: "1.5rem", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
          <div style={{ color: "#777", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <PhoneCall size={16} style={{ color: "#e67e22" }} /> Recados por Resolver
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", color: "#e67e22" }}>
            {totalRecadosPendente}
          </div>
        </div>
      </div>

      {/* Abas Principais */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
        <Link
          href={`/recepcao?tab=agenda&search=${search}`}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: tab === "agenda" ? "#003366" : "white",
            color: tab === "agenda" ? "white" : "#555",
            border: "1px solid #ddd",
            boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
          }}
        >
          Agenda Geral
        </Link>
        <Link
          href={`/recepcao?tab=recados&search=${search}`}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: tab === "recados" ? "#003366" : "white",
            color: tab === "recados" ? "white" : "#555",
            border: "1px solid #ddd",
            boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
          }}
        >
          Central de Recados
        </Link>
      </div>

      {/* Conteúdo Aba Agenda */}
      {tab === "agenda" && (
        <>
          {/* Barra de Filtros Reativa */}
          <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            alignItems: "center",
            background: "white",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            border: "1px solid #eee"
          }}>
            <SearchInput placeholder="Busque compromisso, local ou gestor..." />
            <FilterSelect
              name="status"
              defaultValue={statusFilter}
              options={[
                { value: "", label: "Todos os Status" },
                { value: "PENDENTE", label: "Pendente" },
                { value: "CONCLUIDO", label: "Concluído" },
                { value: "CANCELADO", label: "Cancelado" }
              ]}
            />
            {search || statusFilter ? (
              <Link href="/recepcao?tab=agenda" style={{ fontSize: "0.85rem", color: "#c0392b", fontWeight: 600, textDecoration: "none" }}>
                Limpar Filtros
              </Link>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {meetings.length === 0 ? (
              <div style={{ gridColumn: "1/-1", background: "white", padding: "2rem", borderRadius: "10px", border: "1px solid #eee", textAlign: "center", color: "#999", fontStyle: "italic" }}>
                Nenhum agendamento de reunião correspondente nesta aba.
              </div>
            ) : (
              meetings.map((m) => (
                <div key={m.id} style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  border: "1px solid #eee",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem"
                }}>
                  <div>
                    {/* Cabeçalho do Agendamento */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#002244" }}>{m.title}</h4>
                      <span style={{
                        padding: "3px 6px",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        background: m.privacy === "PRIVADO" ? "#fcedec" : "#eafaf1",
                        color: m.privacy === "PRIVADO" ? "#c0392b" : "#27ae60",
                        border: `1px solid ${m.privacy === "PRIVADO" ? "#c0392b" : "#27ae60"}`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px"
                      }}>
                        {m.privacy === "PRIVADO" ? <Lock size={10} /> : <Unlock size={10} />}
                        {m.privacy === "PRIVADO" ? "Privado" : "Público"}
                      </span>
                    </div>

                    {/* Datas */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#666", marginTop: "8px" }}>
                      <Clock size={14} />
                      <span>
                        {new Date(m.startAt).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(m.endAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Designado / Criador */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px", borderTop: "1px solid #f9f9f9", paddingTop: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
                        <User size={14} style={{ color: "#777" }} />
                        <span style={{ color: "#555" }}>Agenda de: <strong>{m.participants.map((p: any) => p.name).join(", ")}</strong></span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#888", paddingLeft: "20px" }}>
                        Agendado por: {m.creator.name}
                      </div>
                    </div>

                    {/* Links Dinâmicos */}
                    {(m.client || m.employee) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px", borderTop: "1px solid #f9f9f9", paddingTop: "8px" }}>
                        {m.client && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#27ae60" }}>
                            <Building size={12} />
                            <span>Empresa: <strong>{m.client.companyName}</strong></span>
                          </div>
                        )}
                        {m.employee && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#e67e22" }}>
                            <User size={12} />
                            <span>Colaborador: <strong>{m.employee.user?.name || `${m.employee.firstName} ${m.employee.lastName}`}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status do Evento e Ações */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "10px", marginTop: "auto" }}>
                    <div>
                      <span style={{
                        padding: "3px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: m.status === "CONCLUIDO" ? "#e8f8f0" : m.status === "CANCELADO" ? "#fdedec" : "#fef9e7",
                        color: m.status === "CONCLUIDO" ? "#27ae60" : m.status === "CANCELADO" ? "#c0392b" : "#f39c12",
                        border: `1px solid ${m.status === "CONCLUIDO" ? "#27ae60" : m.status === "CANCELADO" ? "#c0392b" : "#f39c12"}`
                      }}>
                        {m.status}
                      </span>
                    </div>

                    {m.status === "PENDENTE" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        {/* Finalizar */}
                        <form action={updateEventStatus}>
                          <input type="hidden" name="eventId" value={m.id} />
                          <input type="hidden" name="status" value="CONCLUIDO" />
                          <button type="submit" style={{ padding: "4px 8px", background: "#27ae60", color: "white", border: "none", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                            Concluir
                          </button>
                        </form>
                        {/* Cancelar */}
                        <form action={updateEventStatus}>
                          <input type="hidden" name="eventId" value={m.id} />
                          <input type="hidden" name="status" value="CANCELADO" />
                          <button type="submit" style={{ padding: "4px 8px", background: "#c0392b", color: "white", border: "none", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Conteúdo Aba Recados */}
      {tab === "recados" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          
          {/* Listagem de Recados */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "1rem",
              background: "white",
              padding: "1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              border: "1px solid #eee"
            }}>
              <SearchInput placeholder="Busque por destinatário, quem ligou..." />
              {search ? (
                <Link href="/recepcao?tab=recados" style={{ display: "inline-flex", alignItems: "center", fontSize: "0.85rem", color: "#c0392b", fontWeight: 600, textDecoration: "none" }}>
                  Limpar
                </Link>
              ) : null}
            </div>

            {phoneMessages.length === 0 ? (
              <div style={{ background: "white", padding: "2.5rem", borderRadius: "10px", border: "1px solid #eee", textAlign: "center", color: "#999", fontStyle: "italic" }}>
                Nenhum recado telefônico anotado.
              </div>
            ) : (
              phoneMessages.map((msg) => (
                <div key={msg.id} style={{
                  background: "white",
                  padding: "1.2rem",
                  borderRadius: "10px",
                  border: "1px solid #eee",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  borderLeft: `4px solid ${msg.status === "RESOLVIDO" ? "#27ae60" : "#e67e22"}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>Para o Colaborador:</span>
                      <h4 style={{ margin: "2px 0 0", fontSize: "0.95rem", color: "#003366", fontWeight: 700 }}>
                        {msg.recipientUser ? msg.recipientUser.name : msg.recipientName}
                      </h4>
                    </div>

                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: msg.status === "RESOLVIDO" ? "#eafaf1" : "#fdf2e9",
                      color: msg.status === "RESOLVIDO" ? "#27ae60" : "#e67e22",
                      border: `1px solid ${msg.status === "RESOLVIDO" ? "#27ae60" : "#e67e22"}`
                    }}>
                      {msg.status === "RESOLVIDO" ? "Resolvido" : "Pendente"}
                    </span>
                  </div>

                  <div style={{ borderTop: "1px dashed #f0f0f0", paddingTop: "8px", marginTop: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#444", fontStyle: "italic", lineHeight: "1.4" }}>
                      "{msg.message}"
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f9f9f9", paddingTop: "8px", fontSize: "0.8rem", color: "#666" }}>
                    <div>
                      📞 <strong>{msg.senderName}</strong> {msg.senderContact ? `(${msg.senderContact})` : ""}
                    </div>
                    <div>
                      {new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {msg.status === "PENDENTE" && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                      <form action={resolvePhoneMessage}>
                        <input type="hidden" name="messageId" value={msg.id} />
                        <button type="submit" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#27ae60",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}>
                          <BookmarkCheck size={14} /> Marcar como Resolvido
                        </button>
                      </form>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

          {/* Form Lateral - Anotar Recado */}
          <NovoRecadoForm users={allUsers} />

        </div>
      )}

    </div>
  );
}

