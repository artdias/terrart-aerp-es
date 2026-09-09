import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const queryWorkplace = searchParams?.workplaceId || "";

  // Busca as Escalas criadas neste mês de competência
  const schedules = await prisma.schedule.findMany({
    where: { 
      competencyMonth: queryMonth,
      ...(queryWorkplace && queryWorkplace !== "ALL" ? { workplaceId: queryWorkplace } : {})
    },
    include: {
      workplace: { include: { client: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const workplaces = await prisma.workplace.findMany({
    where: { client: { deleted: false } },
    include: { client: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container} style={{ maxWidth: '1400px' }}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Fechamento de Escalas</h1>
          <p className={styles.subtitle}>Encerre as escalas e bloqueie alterações. Cálculos financeiros estarão no módulo Financeiro.</p>
        </div>
      </header>

      <FechamentoClient 
        currentMonth={queryMonth} 
        schedules={schedules} 
        workplaces={workplaces}
        currentWorkplace={queryWorkplace}
      />
    </div>
  );
}
