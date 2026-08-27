import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { CalendarClock, Settings, ClipboardList, Wallet, Settings2, Briefcase } from "lucide-react";
import styles from "./EscalasHub.module.css";

export const metadata = {
  title: "Gestão de Escalas | AERP",
};

export default async function EscalasHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const p = (session.user as any).permissions || {};
  const isAdmin = (session.user as any).role === "ADMIN";

  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Motor de Escalas</h1>
          <p className={styles.subtitle}>Gestão inteligente de turnos, ciclos, coberturas e fechamento mensal.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Planejamento e Execução */}
        <Link href="/escalas/planejamento" className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <CalendarClock size={28} />
          </div>
          <h3>Gerador de Escalas</h3>
          <p>Crie, edite e acompanhe a escala mensal por postos e funcionários.</p>
        </Link>

        {/* Ocorrências e Coberturas */}
        <Link href="/escalas/ocorrencias" className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <ClipboardList size={28} />
          </div>
          <h3>Ocorrências e Cobertura</h3>
          <p>Registre faltas, atestados e acione substitutos de forma fácil.</p>
        </Link>

        {/* Fechamento Mensal */}
        <Link href="/escalas/fechamento" className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <Wallet size={28} />
          </div>
          <h3>Fechamento Mensal</h3>
          <p>Consolide as horas reais e prepare prévias financeiras e descontos.</p>
        </Link>
      </div>

      <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Cadastros Base</h2>
      <div className={styles.grid}>
        {/* Turnos */}
        <Link href="/escalas/configuracoes/turnos" className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
            <Settings2 size={28} />
          </div>
          <h3>Turnos de Trabalho</h3>
          <p>Cadastre os horários fixos (Ex: Diurno 07h às 19h).</p>
        </Link>

        {/* Ciclos */}
        <Link href="/escalas/configuracoes/ciclos" className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
            <Settings size={28} />
          </div>
          <h3>Padrões de Ciclo</h3>
          <p>Configure os modelos matemáticos (Ex: 12x36, 6x1).</p>
        </Link>

        {/* Alocações Legado */}
        <Link href="/escalas/alocacoes" className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: '#fdf4ff', color: '#c026d3' }}>
            <Briefcase size={28} />
          </div>
          <h3>Alocações Livres (Antigo)</h3>
          <p>Registro legado de atribuições de funcionários a clientes/tarefas.</p>
        </Link>
      </div>
    </div>
  );
}
