import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkplaceWithRequirements } from "@/actions/workplaceRequirementsActions";
import { getShifts } from "@/actions/scheduleConfigActions";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import styles from "../../EscalasHub.module.css";
import PostoRequirementClient from "./PostoRequirementClient";

export const metadata = {
  title: "Configurar Posto | AERP",
};

export default async function PostoDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  const workplace = await getWorkplaceWithRequirements(params.id);
  const allShifts = await getShifts();

  if (!workplace) {
    return (
      <div className={styles.container}>
        <h2>Posto não encontrado.</h2>
        <Link href="/escalas/postos">Voltar</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/escalas/postos" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Demanda: {workplace.name}</h1>
          <p className={styles.subtitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} /> Cliente: {workplace.client.companyName}
          </p>
        </div>
      </header>

      <PostoRequirementClient workplace={workplace} allShifts={allShifts} />
    </div>
  );
}
