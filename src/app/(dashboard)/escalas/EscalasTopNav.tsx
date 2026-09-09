"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardList, Wallet, Briefcase, Settings2, Settings } from "lucide-react";

export default function EscalasTopNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Gerador", href: "/escalas/planejamento", icon: <CalendarClock size={16} /> },
    { name: "Fechamento", href: "/escalas/fechamento", icon: <Wallet size={16} /> },
    { name: "Postos", href: "/escalas/postos", icon: <Briefcase size={16} /> },
    { name: "Turnos", href: "/escalas/configuracoes/turnos", icon: <Settings2 size={16} /> },
    { name: "Ciclos", href: "/escalas/configuracoes/ciclos", icon: <Settings size={16} /> }
  ];

  return (
    <div className="hide-on-print" style={{ display: 'flex', gap: '8px', padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
      {navItems.map(item => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link 
            key={item.href} 
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: isActive ? '#f0f9ff' : 'transparent',
              color: isActive ? '#0284c7' : '#64748b',
              border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {item.icon}
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}