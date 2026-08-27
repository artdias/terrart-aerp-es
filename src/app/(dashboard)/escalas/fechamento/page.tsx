import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClosingData } from "@/actions/monthlyClosingActions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../EscalasHub.module.css";
import FechamentoClient from "./FechamentoClient";

export const metadata = {
  title: "Fechamento Mensal | AERP",
};

export default async function FechamentoPage({ searchParams }: { searchParams: { month?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  const today = new Date();
  const currentMonth = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
  const queryMonth = searchParams?.month || currentMonth;

  const data = await getClosingData(queryMonth);

  return (
    <div className={styles.container} style={{ maxWidth: '1400px' }}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Fechamento Mensal</h1>
          <p className={styles.subtitle}>Consolidação de eventos (faltas, atrasos e coberturas) e processamento para a folha.</p>
        </div>
      </header>

      <FechamentoClient 
        currentMonth={queryMonth} 
        initialData={data} 
      />
    </div>
  );
}
