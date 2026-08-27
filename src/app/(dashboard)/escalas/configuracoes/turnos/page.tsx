import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShifts } from "@/actions/scheduleConfigActions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TurnoClient from "./TurnoClient";
import styles from "../../EscalasHub.module.css";

export const metadata = {
  title: "Turnos de Trabalho | AERP",
};

export default async function TurnosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  const shifts = await getShifts();

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Turnos de Trabalho</h1>
          <p className={styles.subtitle}>Gerencie os blocos fixos de horário disponíveis para o motor de escalas.</p>
        </div>
      </header>

      <TurnoClient initialShifts={shifts} />
    </div>
  );
}
