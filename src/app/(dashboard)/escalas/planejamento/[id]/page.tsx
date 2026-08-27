import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Check, Printer } from "lucide-react";
import styles from "../../EscalasHub.module.css";

export const metadata = {
  title: "Visualização da Escala | AERP",
};

export default async function EscalaGridPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const schedule = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: {
      assignments: {
        include: {
          employee: { include: { user: true } },
          workplace: true,
          shift: true
        }
      }
    }
  });

  if (!schedule) {
    return <div style={{ padding: '24px' }}>Escala não encontrada.</div>;
  }

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
    const day = a.date.getUTCDate(); // O gerador salvou com setUTCDate(12h) então getUTCDate é seguro.

    if (!gridMap[wpName]) gridMap[wpName] = {};
    if (!gridMap[wpName][empName]) gridMap[wpName][empName] = {};
    
    gridMap[wpName][empName][day] = a;
  });

  return (
    <div className={styles.container} style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/escalas/planejamento" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className={styles.title}>{schedule.name}</h1>
            <p className={styles.subtitle}>Competência: {schedule.competencyMonth} | Status: <strong>{schedule.status}</strong></p>
          </div>
        </div>
        <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', display: 'flex', gap: '8px', cursor: 'pointer' }}>
          <Printer size={18} /> Imprimir PDF
        </button>
      </header>

      {Object.keys(gridMap).length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Nenhum plantão gerado. Verifique as configurações de ciclo dos funcionários e gere novamente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.keys(gridMap).map(wpName => (
            <div key={wpName} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px 16px', fontWeight: 600 }}>
                Posto: {wpName}
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid #e2e8f0', minWidth: '200px', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10 }}>Funcionário</th>
                      {daysArray.map(d => (
                        <th key={d} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', minWidth: '40px' }}>
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(gridMap[wpName]).map(empName => (
                      <tr key={empName} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0', fontWeight: 500, position: 'sticky', left: 0, background: 'white', zIndex: 10 }}>
                          {empName}
                        </td>
                        {daysArray.map(d => {
                          const assignment = gridMap[wpName][empName][d];
                          if (assignment) {
                            return (
                              <td key={d} title={assignment.shift.name} style={{ padding: '4px', textAlign: 'center', borderRight: '1px solid #e2e8f0', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                                <Check size={16} style={{ margin: '0 auto' }} />
                              </td>
                            );
                          } else {
                            return (
                              <td key={d} style={{ padding: '4px', textAlign: 'center', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#cbd5e1' }}>
                                -
                              </td>
                            );
                          }
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
