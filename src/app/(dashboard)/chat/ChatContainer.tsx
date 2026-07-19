"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Trash2, 
  User, 
  MessageSquare, 
  CheckCheck,
  Search,
  MessageCircleOff,
  Users
} from "lucide-react";
import { deleteMessageAction } from "@/actions/chatActions";

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
}

interface ChatContainerProps {
  initialUsers: ChatUser[];
  loggedUserId: string;
}

export default function ChatContainer({ initialUsers, loggedUserId }: ChatContainerProps) {
  const [users, setUsers] = useState<ChatUser[]>(initialUsers);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Polling para atualizar a lista de usuários e badge de não lidas (a cada 4 segundos)
  useEffect(() => {
    const fetchUsersList = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Erro ao carregar lista de usuários:", err);
      }
    };

    const interval = setInterval(fetchUsersList, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2. Polling para carregar mensagens da conversa ativa (a cada 2.5 segundos)
  useEffect(() => {
    if (!activeUser) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?receiverId=${activeUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          
          // Zera localmente o contador do usuário ativo
          setUsers(prevUsers => 
            prevUsers.map(u => u.id === activeUser.id ? { ...u, unreadCount: 0 } : u)
          );
        }
      } catch (err) {
        console.error("Erro ao carregar histórico de mensagens:", err);
      }
    };

    // Executa a primeira busca de imediato ao selecionar o usuário
    fetchMessages();

    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [activeUser]);

  // 3. Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Envio de mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeUser.id,
          content: messageText
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Adiciona a mensagem localmente de imediato
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  // 5. Exclusão de mensagem
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Deseja apagar esta mensagem para todos?")) return;

    // Remover localmente para resposta instantânea
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      const formData = new FormData();
      formData.append("messageId", messageId);
      await deleteMessageAction(formData);
    } catch (err) {
      console.error("Erro ao deletar mensagem:", err);
      alert("Erro ao excluir mensagem.");
    }
  };

  // Filtrar usuários localmente pelo campo de busca
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "320px 1fr",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      border: "1px solid #eee",
      flex: 1,
      overflow: "hidden"
    }}>
      {/* Barra Lateral - Contatos */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #eee",
        background: "#f9fbfd"
      }}>
        {/* Cabeçalho Busca */}
        <div style={{ padding: "16px", borderBottom: "1px solid #eee", background: "white" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <Search size={16} style={{ position: "absolute", left: "12px", color: "#888" }} />
          </div>
        </div>

        {/* Lista de Contatos */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filteredUsers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: "0.85rem", fontStyle: "italic", marginTop: "20px" }}>
              Nenhum colaborador encontrado.
            </p>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = activeUser?.id === u.id;
              return (
                <div 
                  key={u.id}
                  onClick={() => setActiveUser(u)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: isSelected ? "#eef3f8" : "transparent",
                    borderLeft: isSelected ? "4px solid #003366" : "4px solid transparent",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: u.id === "geral" ? "linear-gradient(135deg, #27ae60, #2ece78)" : "#003366",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "0.95rem"
                    }}>
                      {u.id === "geral" ? <Users size={18} /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#333" }}>{u.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>{u.role}</div>
                    </div>
                  </div>

                  {u.unreadCount > 0 && (
                    <span style={{
                      background: "#27ae60",
                      color: "white",
                      borderRadius: "10px",
                      padding: "2px 8px",
                      fontSize: "0.72rem",
                      fontWeight: 700
                    }}>
                      {u.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Janela de Conversa */}
      <div style={{ display: "flex", flexDirection: "column", background: "#f5f7fb" }}>
        {activeUser ? (
          <>
            {/* Header da Conversa */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 20px",
              background: "white",
              borderBottom: "1px solid #eee",
              boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
            }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: activeUser.id === "geral" ? "linear-gradient(135deg, #27ae60, #2ece78)" : "#003366",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600
              }}>
                {activeUser.id === "geral" ? <Users size={16} /> : activeUser.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#333" }}>{activeUser.name}</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#888" }}>
                  {activeUser.id === "geral" ? "Canal Geral • Todos os Colaboradores" : `${activeUser.role} • Chat Corporativo`}
                </p>
              </div>
            </div>

            {/* Histórico de Balões */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#999", fontSize: "0.85rem", fontStyle: "italic", margin: "auto" }}>
                  Comece a conversar com {activeUser.name}! Suas mensagens são criptografadas e seguras.
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.senderId === loggedUserId;
                  const time = new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div 
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isSentByMe ? "flex-end" : "flex-start",
                        width: "100%"
                      }}
                    >
                      <div 
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        style={{
                          maxWidth: "60%",
                          padding: "10px 14px",
                          borderRadius: isSentByMe ? "14px 14px 0 14px" : "14px 14px 14px 0",
                          background: isSentByMe ? "#003366" : "white",
                          color: isSentByMe ? "white" : "#333",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          position: "relative"
                        }}
                        className="chat-bubble"
                      >
                        {/* Conteúdo */}
                        <div style={{ fontSize: "0.9rem", wordBreak: "break-word", lineHeight: "1.4" }}>
                          {!isSentByMe && activeUser.id === "geral" && (
                            <div style={{
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              color: "#27ae60",
                              marginBottom: "4px"
                            }}>
                              {msg.sender?.name || "Colaborador"}
                            </div>
                          )}
                          {msg.content}
                        </div>

                        {/* Rodapé do Balão (Horário + Confirmação) */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          fontSize: "0.68rem",
                          color: isSentByMe ? "rgba(255,255,255,0.7)" : "#999",
                          marginTop: "4px",
                          gap: "4px"
                        }}>
                          <span>{time}</span>
                          {isSentByMe && activeUser.id !== "geral" && (
                            <CheckCheck 
                              size={14} 
                              style={{ color: msg.read ? "#3498db" : "rgba(255,255,255,0.5)" }} 
                            />
                          )}
                        </div>

                        {/* Botão de Exclusão (Lixeira) - flutua no hover */}
                        {isSentByMe && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            style={{
                              position: "absolute",
                              left: "-32px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#c0392b",
                              cursor: "pointer",
                              padding: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                              transition: "opacity 0.2s",
                              opacity: hoveredMsgId === msg.id ? 1 : 0,
                              pointerEvents: hoveredMsgId === msg.id ? "auto" : "none"
                            }}
                            title="Apagar Mensagem"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Entrada (Input / Enviar) */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: "16px 20px",
                background: "white",
                borderTop: "1px solid #eee",
                display: "flex",
                gap: "10px",
                alignItems: "center"
              }}
            >
              <input 
                type="text" 
                placeholder="Escreva uma mensagem..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "24px",
                  border: "1px solid #ddd",
                  fontSize: "0.88rem",
                  outline: "none",
                  background: "#f9f9f9"
                }}
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  background: !inputText.trim() ? "#ccc" : "#003366",
                  color: "white",
                  border: "none",
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !inputText.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            color: "#888",
            gap: "16px"
          }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#eef3f8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#003366"
            }}>
              <MessageCircleOff size={36} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: "0 0 6px 0", color: "#333", fontWeight: 700 }}>Chat Corporativo AERP</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>Selecione um colaborador ao lado para iniciar a conversa.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
