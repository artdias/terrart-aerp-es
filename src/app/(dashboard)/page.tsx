import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Building2, Users, Box, DollarSign, PhoneCall, 
  ArrowRight, ShieldCheck, ClipboardList, Settings, Check, Clock, Cake 
} from "lucide-react";
import styles from "./clientes/clientes.module.css";
import DashboardCalendar from "@/components/DashboardCalendar";
import { resolvePhoneMessage } from "@/actions/receptionActions";

function getBirthdaysThisWeek(employees: any[]) {
  const today = new Date();
  
  // Início da semana (Domingo 00:00) e Fim da semana (Sábado 23:59:59)
  const currentDay = today.getDay(); // 0 = Domingo, 6 = Sábado
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const currentYear = today.getFullYear();
  const birthdays: any[] = [];

  for (const emp of employees) {
    if (!emp.birthDate) continue;

    let bMonth: number | null = null;
    let bDay: number | null = null;
    let bYear: number | null = null;

    if (emp.birthDate.includes("-")) {
      const parts = emp.birthDate.split("T")[0].split("-");
      if (parts.length === 3) {
        bYear = parseInt(parts[0], 10);
        bMonth = parseInt(parts[1], 10);
        bDay = parseInt(parts[2], 10);
      }
    } else if (emp.birthDate.includes("/")) {
      const parts = emp.birthDate.split("/");
      if (parts.length === 3) {
        bDay = parseInt(parts[0], 10);
        bMonth = parseInt(parts[1], 10);
        bYear = parseInt(parts[2], 10);
      }
    }

    if (!bMonth || !bDay || isNaN(bMonth) || isNaN(bDay)) continue;

    const birthThisYear = new Date(currentYear, bMonth - 1, bDay, 12, 0, 0);

    if (birthThisYear >= startOfWeek && birthThisYear <= endOfWeek) {
      const isToday = birthThisYear.getDate() === today.getDate() && birthThisYear.getMonth() === today.getMonth();
      
      let age: number | null = null;
      if (bYear && !isNaN(bYear)) {
        age = currentYear - bYear;
      }

      const weekDayName = birthThisYear.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayFormatted = `${String(bDay).padStart(2, "0")}/${String(bMonth).padStart(2, "0")}`;

      birthdays.push({
        ...emp,
        name: emp.user?.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Funcionário",
        birthDateFormatted: dayFormatted,
        weekDayName: weekDayName.replace(".", "").toUpperCase(),
        isToday,
        age,
        dateObj: birthThisYear
      });
    }
  }

  birthdays.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  return birthdays;
}

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const userId = (session.user as any).id;
  if (!userId) redirect("/login");
  
  const userRole = (session.user as any).role;
  const isAdmin = userRole === "ADMIN" || session.user.email === "admin";
  const userPermissions = (session.user as any).permissions || {};

  // 1. Buscar compromissos da agenda do usuário logado
  const events = await prisma.scheduleEvent.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { participants: { some: { id: userId } } }
      ]
    },
    include: {
      client: true,
      employee: true,
      participants: true
    },
    orderBy: { startAt: "asc" }
  });

  // Formatar datas para strings seguras antes de enviar ao Client Component
  const formattedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    startAt: e.startAt ? new Date(e.startAt).toISOString() : new Date().toISOString(),
    endAt: e.endAt ? new Date(e.endAt).toISOString() : new Date().toISOString(),
    status: e.status,
    privacy: e.privacy,
    creatorId: e.creatorId,
    participants: e.participants.map((p: any) => ({ id: p.id, name: p.name })),
    clientId: e.clientId,
    employeeId: e.employeeId,
    client: e.client ? { companyName: e.client.companyName } : null,
    employee: e.employee ? { firstName: e.employee.firstName || "Sem Nome", lastName: e.employee.lastName } : null
  }));

  // 2. Buscar métricas dinâmicas com base nas permissões
  let clientesCount = 0;
  let funcionariosCount = 0;
  let emAnaliseCount = 0;
  let estoqueCount = 0;
  let estoqueAlertaCount = 0;
  let cautelasCount = 0;
  let receitaPendente = 0;
  let despesaPendente = 0;
  let recadosCount = 0;
  let pendingMessages: any[] = [];

  if (isAdmin || userPermissions.allowClientes) {
    clientesCount = await prisma.client.count({ where: { deleted: false } });
  }
  if (isAdmin || userPermissions.allowFuncionarios) {
    funcionariosCount = await prisma.employee.count({ where: { deleted: false } });
    emAnaliseCount = await prisma.employee.count({ where: { deleted: false, status: "Em Análise" } });
  }
  if (isAdmin || userPermissions.allowEstoque) {
    estoqueCount = await prisma.product.count({ where: { deleted: false } });
    const products = await prisma.product.findMany({ where: { deleted: false } });
    estoqueAlertaCount = products.filter(p => p.quantity <= p.minQuantity).length;
  }
  if (isAdmin || userPermissions.allowCautelas) {
    cautelasCount = await prisma.employeeEquipment.count({ where: { status: "EM USO" } });
  }
  if (isAdmin || userPermissions.allowFinanceiro) {
    const pendingInvoices = await prisma.invoice.aggregate({
      where: { status: "PENDENTE" },
      _sum: { amount: true }
    });
    const pendingExpenses = await prisma.expense.aggregate({
      where: { status: "PENDENTE" },
      _sum: { amount: true }
    });
    receitaPendente = pendingInvoices._sum?.amount || 0;
    despesaPendente = pendingExpenses._sum?.amount || 0;
  }
  if (isAdmin || userPermissions.allowRecepcao) {
    recadosCount = await prisma.phoneMessage.count({ where: { status: "PENDENTE" } });
    pendingMessages = await prisma.phoneMessage.findMany({
      where: { status: "PENDENTE" },
      orderBy: { createdAt: "desc" },
      take: 5
    });
  } else {
    // Normal users see messages directed to them
    const myName = session.user.name || "";
    if (myName) {
      recadosCount = await prisma.phoneMessage.count({ 
        where: { status: "PENDENTE", recipientName: { contains: myName, mode: "insensitive" } } 
      });
      pendingMessages = await prisma.phoneMessage.findMany({
        where: { status: "PENDENTE", recipientName: { contains: myName, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 5
      });
    }
  }

  // 3. Buscar perfil e atribuições se for colaborador comum (Não-Admin)
  let employeeProfile: any = null;
  if (!isAdmin) {
    employeeProfile = await prisma.employee.findFirst({
      where: {
        userId: userId,
        deleted: false
      },
      include: {
        workplace: { include: { client: true } },
        equipments: { where: { status: "EM USO" }, include: { product: true } },
        jobAllocations: true
      }
    });
  }

  // Buscar listas auxiliares para o formulário de novos agendamentos na agenda
  const usersList = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  const clientsList = await prisma.client.findMany({
    select: { id: true, companyName: true },
    where: { deleted: false }, orderBy: { companyName: 'asc' }
  });

  const employeesList = await prisma.employee.findMany({
    where: { deleted: false, status: "Ativo" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" }
  });

  const allEmployeesForBirthdays = await prisma.employee.findMany({
    where: { deleted: false, status: "Ativo", birthDate: { not: null } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      photoUrl: true,
      roleTitle: true,
      user: { select: { name: true } }
    }
  });

  const birthdaysThisWeek = getBirthdaysThisWeek(allEmployeesForBirthdays);

  return (
    <div className={styles.container}>
      {/* Header de boas-vindas */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.8rem", color: "#002244", margin: "0 0 4px 0" }}>
          Olá, {session.user.name || "Colaborador"}!
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
          Bem-vindo ao painel central do AERP. Confira suas atribuições e agenda de compromissos.
        </p>
      </div>

      {/* Grid de Métricas Modulares */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* Card Clientes */}
        {(isAdmin || userPermissions.allowClientes) && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Clientes Ativos</span>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a", margin: "6px 0 0 0" }}>{clientesCount}</p>
              </div>
              <div style={{ background: "#eef2f6", padding: "8px", borderRadius: "8px", color: "#003366" }}>
                <Building2 size={20} />
              </div>
            </div>
            <Link href="/clientes" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#3498db", textDecoration: "none", marginTop: "12px", fontWeight: 600 }}>
              Gerenciar Clientes <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Card Funcionários */}
        {(isAdmin || userPermissions.allowFuncionarios) && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Funcionários</span>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a", margin: "6px 0 0 0" }}>{funcionariosCount}</p>
              </div>
              <div style={{ background: "#eef2f6", padding: "8px", borderRadius: "8px", color: "#003366" }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "0.78rem" }}>
              <span style={{ color: "#f39c12", fontWeight: 600 }}>{emAnaliseCount} em análise</span>
              <Link href="/funcionarios" style={{ display: "flex", alignItems: "center", gap: "4px", color: "#3498db", textDecoration: "none", fontWeight: 600 }}>
                Consultar Fichas <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Card Estoque */}
        {(isAdmin || userPermissions.allowEstoque) && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Materiais/EPIs</span>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a", margin: "6px 0 0 0" }}>{estoqueCount}</p>
              </div>
              <div style={{ background: "#eef2f6", padding: "8px", borderRadius: "8px", color: "#003366" }}>
                <Box size={20} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "0.78rem" }}>
              <span style={{ color: estoqueAlertaCount > 0 ? "#e74c3c" : "#27ae60", fontWeight: 600 }}>
                {estoqueAlertaCount} alertas de mínimo
              </span>
              <Link href="/estoque" style={{ display: "flex", alignItems: "center", gap: "4px", color: "#3498db", textDecoration: "none", fontWeight: 600 }}>
                Ver Inventário <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Card Cautelas */}
        {(isAdmin || userPermissions.allowCautelas) && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Cautelas Ativas</span>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a", margin: "6px 0 0 0" }}>{cautelasCount}</p>
              </div>
              <div style={{ background: "#eef2f6", padding: "8px", borderRadius: "8px", color: "#003366" }}>
                <ShieldCheck size={20} />
              </div>
            </div>
            <Link href="/cautelas" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#3498db", textDecoration: "none", marginTop: "12px", fontWeight: 600 }}>
              Visualizar Entregas <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Card Financeiro */}
        {(isAdmin || userPermissions.allowFinanceiro) && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)", gridColumn: "span 1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Fluxo Pendente</span>
                <div style={{ fontSize: "0.85rem", color: "#27ae60", fontWeight: 600, marginTop: "6px" }}>Rec: R$ {receitaPendente.toFixed(2)}</div>
                <div style={{ fontSize: "0.85rem", color: "#e74c3c", fontWeight: 600, marginTop: "2px" }}>Pag: R$ {despesaPendente.toFixed(2)}</div>
              </div>
              <div style={{ background: "#eef2f6", padding: "8px", borderRadius: "8px", color: "#003366" }}>
                <DollarSign size={20} />
              </div>
            </div>
            <Link href="/financeiro" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#3498db", textDecoration: "none", marginTop: "10px", fontWeight: 600 }}>
              Acessar Caixa <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Card Recepção */}
        {(isAdmin || userPermissions.allowRecepcao) && (
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Recados Pendentes</span>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a", margin: "6px 0 0 0" }}>{recadosCount}</p>
              </div>
              <div style={{ background: "#eef2f6", padding: "8px", borderRadius: "8px", color: "#003366" }}>
                <PhoneCall size={20} />
              </div>
            </div>
            <Link href="/recepcao" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#3498db", textDecoration: "none", marginTop: "12px", fontWeight: 600 }}>
              Ver Telefone/Recados <ArrowRight size={12} />
            </Link>
          </div>
        )}

      </div>

      {/* Grid Principal Layout (Agenda e Atribuições) */}
      <div className="dashboard-grid">
        
        {/* Coluna Esquerda: Agenda (Calendário) */}
        <div>
          <DashboardCalendar 
            events={formattedEvents} 
            users={usersList}
            clients={clientsList}
            employees={employeesList.map(emp => ({ id: emp.id, name: `${emp.firstName} ${emp.lastName || ""}`.trim() }))}
          />
        </div>

        {/* Coluna Direita: Painel Contextual/Atribuições */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Card Aniversariantes da Semana */}
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#002244", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Cake size={18} style={{ color: "#d97706" }} /> Aniversariantes da Semana
              </span>
              {birthdaysThisWeek.length > 0 && (
                <span style={{ background: "#fef3c7", color: "#d97706", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                  {birthdaysThisWeek.length} {birthdaysThisWeek.length === 1 ? "aniversariante" : "aniversariantes"}
                </span>
              )}
            </h4>

            {birthdaysThisWeek.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
                Nenhum aniversariante nesta semana. 🎈
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {birthdaysThisWeek.map((bDay) => (
                  <div 
                    key={bDay.id} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "10px", 
                      borderRadius: "8px", 
                      background: bDay.isToday ? "#f0fdf4" : "#f8fafc",
                      border: bDay.isToday ? "1px solid #bbf7d0" : "1px solid #e2e8f0" 
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {bDay.photoUrl ? (
                        <img src={bDay.photoUrl} alt={bDay.name} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: bDay.isToday ? "#16a34a" : "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.85rem" }}>
                          {bDay.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#1e293b", display: "block" }}>
                          {bDay.name}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {bDay.roleTitle || "Colaborador"} {bDay.age !== null ? `• ${bDay.age} anos` : ""}
                        </span>
                      </div>
                    </div>

                    <div>
                      {bDay.isToday ? (
                        <span style={{ background: "#22c55e", color: "white", fontSize: "0.72rem", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                          🎉 Hoje! ({bDay.birthDateFormatted})
                        </span>
                      ) : (
                        <span style={{ background: "#e2e8f0", color: "#334155", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                          {bDay.weekDayName}, {bDay.birthDateFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Se for Colaborador de Posto (Visualização de Equipamentos e Postos) */}
          {employeeProfile && (
            <>
              {/* Card Posto Alocado */}
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#002244", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building2 size={16} /> Meu Posto Alocado
                </h4>
                {employeeProfile.workplace ? (
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "#1a1a1a" }}>
                      {employeeProfile.workplace.client.companyName}
                    </strong>
                    <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#666" }}>
                      Posto: {employeeProfile.workplace.name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#666" }}>
                      Endereço: {employeeProfile.workplace.address}
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>
                    Você não possui alocação ativa no momento.
                  </p>
                )}
              </div>

              {/* Card Materiais sob Cautela */}
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#002244", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} /> Materiais em Minha Posse
                </h4>
                {employeeProfile.equipments.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>
                    Nenhum EPI ou material assinado sob sua cautela.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {employeeProfile.equipments.map((eq: any) => (
                      <div key={eq.id} style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", border: "1px solid #e2e8f0" }}>
                        <strong style={{ color: "#334155" }}>{eq.product.name}</strong>
                        <div style={{ color: "#64748b", marginTop: "2px" }}>Quantidade: {eq.quantity} {eq.product.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Escalas de Serviço */}
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#002244", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ClipboardList size={16} /> Minhas Escalas
                </h4>
                {employeeProfile.jobAllocations.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>
                    Sem escalas de serviço atribuídas.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {employeeProfile.jobAllocations.map((alloc: any) => (
                      <div key={alloc.id} style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", border: "1px solid #e2e8f0" }}>
                        <strong style={{ color: "#334155" }}>Tarefa: {alloc.task}</strong>
                        <div style={{ color: "#64748b", marginTop: "2px" }}>Duração: {alloc.duration || "Não informada"}</div>
                        <div style={{ color: "#64748b", marginTop: "2px" }}>Situação: {alloc.status}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Se tiver permissões administrativas (Visualização de Recados e Atalhos Rápidos) */}
          {(isAdmin || userPermissions.allowRecepcao || userPermissions.allowClientes || userPermissions.allowFuncionarios || userPermissions.allowEstoque || userPermissions.allowFinanceiro) && (
            <>
              {/* Card Atalhos Rápidos */}
              {(isAdmin || userPermissions.allowClientes || userPermissions.allowFuncionarios || userPermissions.allowEstoque || userPermissions.allowFinanceiro) && (
                <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#002244", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Settings size={16} /> Atalhos Rápidos
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(isAdmin || userPermissions.allowClientes) && (
                      <Link href="/clientes" style={{ display: "block", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
                        ＋ Adicionar Posto/Cliente
                      </Link>
                    )}
                    {(isAdmin || userPermissions.allowFuncionarios) && (
                      <Link href="/funcionarios" style={{ display: "block", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
                        ＋ Contratar Colaborador
                      </Link>
                    )}
                    {(isAdmin || userPermissions.allowEstoque) && (
                      <Link href="/estoque" style={{ display: "block", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
                        ＋ Lançamento de Estoque/EPI
                      </Link>
                    )}
                    {(isAdmin || userPermissions.allowFinanceiro) && (
                      <Link href="/financeiro" style={{ display: "block", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
                        ＋ Registrar Despesa/Pagamento
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Card Recados da Recepção ou Pessoais */}
              {(isAdmin || userPermissions.allowRecepcao || recadosCount > 0) && (
                <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#002244", borderBottom: "1px solid #eee", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <PhoneCall size={16} /> {(isAdmin || userPermissions.allowRecepcao) ? "Caixa de Recados (Recepção)" : "Meus Recados"}
                  </h4>
                  {pendingMessages.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#999", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                      Sem recados pendentes no momento.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {pendingMessages.map((msg) => (
                        <div key={msg.id} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px", background: "#fafafa" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "0.8rem", color: "#334155" }}>Para: {msg.recipientName}</strong>
                            
                            <form action={resolvePhoneMessage}>
                              <input type="hidden" name="messageId" value={msg.id} />
                              <button
                                type="submit"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#27ae60",
                                  cursor: "pointer",
                                  padding: "2px",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                                title="Marcar como Resolvido"
                              >
                                <Check size={14} />
                              </button>
                            </form>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={10} />
                            <span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span>
                          </div>
                          <p style={{ margin: "6px 0 0 0", fontSize: "0.78rem", color: "#1e293b", lineHeight: "1.3" }}>
                            <strong>{msg.senderName}</strong>: {msg.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
