import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShiftPatterns } from "@/actions/scheduleConfigActions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CicloClient from "./CicloClient";
import styles from "../../EscalasHub.module.css";

export const metadata = {
  title: "Padrões de Ciclo | AERP",
};

export default async function CiclosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  const patterns = await getShiftPatterns();

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Padrões de Ciclo (Modelos)</h1>
          <p className={styles.subtitle}>Crie os padrões matemáticos de dias trabalhados x folgas (Ex: 12x36, 6x1).</p>
        </div>
      </header>

      <CicloClient initialPatterns={patterns} />
    </div>
  );
}
