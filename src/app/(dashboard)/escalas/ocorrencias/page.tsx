import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAssignmentsByDate, getActiveEmployeesForSubstitute } from "@/actions/occurrenceActions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../EscalasHub.module.css";
import OcorrenciasClient from "./OcorrenciasClient";

export const metadata = {
  title: "Ocorrências Diárias | AERP",
};

export default async function OcorrenciasPage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  // Define data padrão como hoje (Y-M-D local time)
  const today = new Date();
  const defaultDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
  const queryDate = searchParams?.date || defaultDate;

  const assignments = await getAssignmentsByDate(queryDate);
  const activeEmployees = await getActiveEmployeesForSubstitute();

  return (
    <div className={styles.container} style={{ maxWidth: '1400px' }}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Ocorrências e Coberturas</h1>
          <p className={styles.subtitle}>Gerencie presenças, faltas e aloque substitutos para os plantões diários.</p>
        </div>
      </header>

      <OcorrenciasClient 
        currentDate={queryDate} 
        initialAssignments={assignments} 
        activeEmployees={activeEmployees} 
      />
    </div>
  );
}
