import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientsWithWorkplaces } from "@/actions/workplaceRequirementsActions";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import styles from "../EscalasHub.module.css";

export const metadata = {
  title: "Demandas por Posto | AERP",
};

export default async function PostosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowEscalas) {
    redirect("/");
  }

  const clients = await getClientsWithWorkplaces();

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/escalas" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className={styles.title}>Demandas de Escala por Posto</h1>
          <p className={styles.subtitle}>Selecione um posto de trabalho para configurar quantos funcionários e quais turnos ele exige.</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {clients.length === 0 && (
          <p style={{ color: '#6b7280' }}>Nenhum cliente com postos cadastrados.</p>
        )}
        
        {clients.map(client => {
          if (client.workplaces.length === 0) return null; // Não exibe clientes sem postos

          return (
            <div key={client.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={24} color="#6b7280" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{client.companyName}</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', padding: '24px' }}>
                {client.workplaces.map(wp => (
                  <Link 
                    key={wp.id} 
                    href={`/escalas/postos/${wp.id}`} 
                    style={{ 
                      display: 'block', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', 
                      textDecoration: 'none', color: 'inherit', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#93c5fd')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '8px', borderRadius: '6px' }}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: '#111827' }}>{wp.name}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                          Turnos Configurados: {wp.shiftRequirements.length}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
