"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  Users, Briefcase, Box, DollarSign, LogOut, Home, CalendarClock, ShieldCheck, 
  Scale, HandCoins, ConciergeBell, Settings, MessageSquare, ShieldAlert, Trash2, 
  FileSpreadsheet, UserCheck, Wallet, ChevronDown, ChevronRight,
  Database, Contact, Landmark, Gavel, Search
} from "lucide-react";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuSections = [
    {
      title: "",
      icon: null,
      items: [
        { name: "Início", path: "/", icon: Home },
        { name: "Chat Interno", path: "/chat", icon: MessageSquare },
      ]
    },
    {
      title: "Cadastro",
      icon: Database,
      items: [
        { name: "Clientes", path: "/clientes", icon: Briefcase },
        { name: "Funcionários", path: "/funcionarios", icon: Users },
        { name: "Estoque", path: "/estoque", icon: Box },
      ]
    },
    {
      title: "Pessoal",
      icon: Contact,
      items: [
        { name: "Recursos Humanos", path: "/rh", icon: UserCheck },
        { name: "Escalas", path: "/escalas", icon: CalendarClock },
        { name: "Atribuição", path: "/cautelas", icon: ShieldCheck },
        { name: "Recepção", path: "/recepcao", icon: ConciergeBell },
      ]
    },
    {
      title: "Financeiro",
      icon: Landmark,
      items: [
        { name: "Contas", path: "/financeiro", icon: DollarSign },
        { name: "Folha de Pagamento", path: "/financeiro/folha-pagamento", icon: Wallet },
        { name: "Faturamento Clientes", path: "/financeiro-clientes", icon: HandCoins },
      ]
    },
    {
      title: "Jurídico",
      icon: Gavel,
      items: [
        { name: "Contratos", path: "/juridico", icon: Scale },
      ]
    },
    {
      title: "Consultas",
      icon: Search,
      items: [
        { name: "Lixeira", path: "/lixeira", icon: Trash2 },
        { name: "Relatórios", path: "/relatorios", icon: FileSpreadsheet },
      ]
    }
  ];

  const filteredSections = menuSections.map(section => {
    const items = section.items.filter(item => {
      if (!session?.user) return false;
      if ((session.user as any).role === "ADMIN") return true;

      const p = (session.user as any).permissions || {};
      if (item.path === "/") return true;
      if (item.path === "/chat") return true;
      if (item.path === "/lixeira") return true;
      if (item.path === "/relatorios") return p.allowRelatorios;
      if (item.path === "/clientes") return p.allowClientes;
      if (item.path === "/funcionarios") return p.allowFuncionarios;
      if (item.path === "/escalas") return p.allowEscalas;
      if (item.path === "/estoque") return p.allowEstoque;
      if (item.path === "/cautelas") return p.allowCautelas;
      if (item.path === "/financeiro") return p.allowFinanceiro;
      if (item.path === "/financeiro/folha-pagamento") return p.allowFinanceiro;
      if (item.path === "/juridico") return p.allowJuridico;
      if (item.path === "/financeiro-clientes") return p.allowFaturamento;
      if (item.path === "/recepcao") return p.allowRecepcao;
      if (item.path === "/rh") return p.allowRh;
      return false;
    });
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  if (session?.user?.email === "admin") {
    filteredSections.push({
      title: "Administração",
      icon: Settings,
      items: [
        { name: "Usuários", path: "/usuarios", icon: Users },
        { name: "Auditoria", path: "/auditoria", icon: ShieldAlert },
      ]
    });
  }

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    filteredSections.forEach(sec => {
      if (!sec.title) return;
      const hasActive = sec.items.some(item => pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/")));
      if (hasActive) {
        initialExpanded[sec.title] = true;
      }
    });
    setExpanded(prev => ({ ...prev, ...initialExpanded }));
  }, [pathname]);

  const toggleSection = (title: string) => {
    setExpanded(prev => ({ ...prev, [title]: !prev[title] }));
  };

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
        {filteredSections.map((section, idx) => {
          if (!section.title) {
            return (
              <div key={idx} style={{ marginBottom: "16px" }}>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
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
              </div>
            );
          }

          const isExpanded = expanded[section.title];
          const SectionIcon = section.icon as any;

          return (
            <div key={idx} style={{ marginBottom: "8px" }}>
              <button 
                onClick={() => toggleSection(section.title)}
                style={{ 
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                  color: isExpanded ? '#f8fafc' : '#94a3b8', transition: 'color 0.2s ease',
                  fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {SectionIcon && <SectionIcon size={18} />}
                  <span>{section.title}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isExpanded && (
                <div style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
                    return (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                        style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>
          AERP v1.0
        </div>
      </div>
    </aside>
  );
}