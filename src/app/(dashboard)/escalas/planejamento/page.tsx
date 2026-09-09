import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedules } from "@/actions/scheduleGeneratorActions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../EscalasHub.module.css";
import PlanejamentoClient from "./PlanejamentoClient";

import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Planejamento de Escalas | AERP",
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
  
  // Fetch workplaces to allow user to select which company to plan for
  const workplaces = await prisma.workplace.findMany({
    where: { client: { deleted: false } },
    include: { client: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Planejamento de Escalas (Calendário)</h1>
          <p className={styles.subtitle}>Crie a grade mensal por Empresa. Preencha automaticamente ou monte de forma manual e dinâmica.</p>
        </div>
      </header>

      <PlanejamentoClient initialSchedules={schedules} workplaces={workplaces} />
    </div>
  );
}
