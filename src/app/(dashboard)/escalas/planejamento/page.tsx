import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedules } from "@/actions/scheduleGeneratorActions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../EscalasHub.module.css";
import PlanejamentoClient from "./PlanejamentoClient";

export const metadata = {
  title: "Gerador de Escalas | AERP",
};

export default async function PlanejamentoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  const schedules = await getSchedules();

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Gerador de Escalas</h1>
          <p className={styles.subtitle}>Crie a grade mensal projetando matematicamente o ciclo de cada funcionário.</p>
        </div>
      </header>

      <PlanejamentoClient initialSchedules={schedules} />
    </div>
  );
}
