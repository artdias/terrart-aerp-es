"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Users, Briefcase, Box, DollarSign, LogOut, Home, CalendarClock, ShieldCheck, Scale, HandCoins, ConciergeBell, Settings, MessageSquare, ShieldAlert, Trash2, FileSpreadsheet } from "lucide-react";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    { name: "Início", path: "/", icon: Home },
    { name: "Clientes", path: "/clientes", icon: Briefcase },
    { name: "Funcionários", path: "/funcionarios", icon: Users },
    { name: "Escalas", path: "/escalas", icon: CalendarClock },
    { name: "Estoque", path: "/estoque", icon: Box },
    { name: "Atribuições", path: "/cautelas", icon: ShieldCheck },
    { name: "Financeiro", path: "/financeiro", icon: DollarSign },
    { name: "Jurídico", path: "/juridico", icon: Scale },
    { name: "Faturamento Clientes", path: "/financeiro-clientes", icon: HandCoins },
    { name: "Recepção", path: "/recepcao", icon: ConciergeBell },
    { name: "Chat Interno", path: "/chat", icon: MessageSquare },
    { name: "Lixeira", path: "/lixeira", icon: Trash2 },
    { name: "Relatórios", path: "/relatorios", icon: FileSpreadsheet },
  ];

  // Filtro de permissões modulares
  const filteredMenuItems = menuItems.filter(item => {
    if (!session?.user) return false;
    if ((session.user as any).role === "ADMIN") return true;

    const p = (session.user as any).permissions || {};
    if (item.path === "/") return true;
    if (item.path === "/chat") return true; // Todos os usuários logados acessam o chat
    if (item.path === "/lixeira") return true; // Todos os usuários logados acessam a lixeira
    if (item.path === "/relatorios") return p.allowRelatorios;
    if (item.path === "/clientes") return p.allowClientes;
    if (item.path === "/funcionarios") return p.allowFuncionarios;
    if (item.path === "/escalas") return p.allowEscalas;
    if (item.path === "/estoque") return p.allowEstoque;
    if (item.path === "/cautelas") return p.allowCautelas;
    if (item.path === "/financeiro") return p.allowFinanceiro;
    if (item.path === "/juridico") return p.allowJuridico;
    if (item.path === "/financeiro-clientes") return p.allowFaturamento;
    if (item.path === "/recepcao") return p.allowRecepcao;
    return false;
  });

  // Se o usuário for o administrador master, adiciona os menus de gerenciamento e auditoria
  if (session?.user?.email === "admin") {
    filteredMenuItems.push({ name: "Usuários", path: "/usuarios", icon: Settings });
    filteredMenuItems.push({ name: "Auditoria", path: "/auditoria", icon: ShieldAlert });
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "10px" }}>
        <div style={{ overflow: "hidden", display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="ES Elite Soluções" style={{ maxWidth: "160px", maxHeight: "80px", objectFit: "contain", transform: "scale(1.4)", transformOrigin: "left center", marginLeft: "10px" }} />
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })} 
          className={styles.mobileLogoutBtn} 
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
      
      <nav className={styles.nav}>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{session?.user?.name?.charAt(0) || "U"}</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{session?.user?.name}</span>
            <span className={styles.userRole}>{session?.user?.email}</span>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
