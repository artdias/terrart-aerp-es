import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPayrollData } from "@/actions/payrollActions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FolhaClient from "./FolhaClient";

export const metadata = {
  title: "Folha de Pagamento | AERP",
};

export default async function FolhaPagamentoPage({ searchParams }: { searchParams: { month?: string, workplaceId?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowFinanceiro) {
    redirect("/");
  }

  const today = new Date();
  const currentMonth = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
  const queryMonth = searchParams?.month || currentMonth;
  const queryWorkplace = searchParams?.workplaceId || "";

  const payrollData = await getPayrollData(queryMonth, queryWorkplace === "ALL" ? undefined : queryWorkplace);

  const workplaces = await prisma.workplace.findMany({
    where: { client: { deleted: false } },
    include: { client: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/financeiro" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>Folha de Pagamento</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Cálculo de acertos baseados nas escalas encerradas.</p>
        </div>
      </header>

      <FolhaClient 
        currentMonth={queryMonth} 
        initialData={payrollData} 
        workplaces={workplaces}
        currentWorkplace={queryWorkplace}
      />
    </div>
  );
}
