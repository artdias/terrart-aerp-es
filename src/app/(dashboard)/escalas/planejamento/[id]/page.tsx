import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../EscalasHub.module.css";
import DynamicGridClient from "./DynamicGridClient";
import PrintButton from "./PrintButton";
import CloseScheduleButton from "./CloseScheduleButton";
import { getDropdownDataForGrid } from "@/actions/dynamicScheduleActions";

export const metadata = {
  title: "Planejamento da Grade | AERP",
};

export default async function EscalaGridPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const schedule = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: {
      workplace: true,
      assignments: {
        include: {
          employee: { include: { user: true } },
          workplace: true,
          shift: true,
          coverages: { include: { substituteEmployee: { include: { user: true } } } },
          occurrences: true
        }
      }
    }
  });

  if (!schedule) {
    return <div style={{ padding: '24px' }}>Escala não encontrada.</div>;
  }

  // Obter dados para os dropdowns (Funcionários ativos e Turnos)
  const { employees, shifts } = await getDropdownDataForGrid();

  // 1. Determinar os dias do mês
  const [year, month] = schedule.competencyMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 2. Agrupar Assignments por Posto -> Funcionário -> Dia
  // Estrutura: map[workplaceName][employeeName][dayNumber] = assignment
  const gridMap: any = {};
  
  schedule.assignments.forEach(a => {
    const wpName = a.workplace.name;
    const empName = a.employee.user?.name || a.employee.firstName || "Sem Nome";
    
    // a.date está em UTC. Para pegar o dia correto localmente sem sofrer com offset:
    const day = a.date.getUTCDate();

    if (!gridMap[wpName]) gridMap[wpName] = {};
    if (!gridMap[wpName][empName]) gridMap[wpName][empName] = {};
    
    gridMap[wpName][empName][day] = a;
  });

  return (
    <div className={styles.container} style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/escalas/planejamento" className="hide-on-print" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className={styles.title}>{schedule.name}</h1>
            <p className={styles.subtitle}>Competência: {schedule.competencyMonth} | Empresa: <strong>{schedule.workplace?.name || 'Global'}</strong></p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <CloseScheduleButton 
            scheduleId={schedule.id} 
            currentStatus={schedule.status}
            competencyMonth={schedule.competencyMonth}
            workplaceId={schedule.workplaceId || "ALL"}
          />
          <PrintButton />
        </div>
      </header>

      <DynamicGridClient 
        schedule={schedule}
        daysArray={daysArray}
        gridMap={gridMap}
        employees={employees}
        shifts={shifts}
      />
    </div>
  );
}
