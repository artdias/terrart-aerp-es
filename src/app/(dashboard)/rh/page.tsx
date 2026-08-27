import React from "react";
import styles from "../clientes/clientes.module.css";
import Link from "next/link";
import { Users, UserPlus, UserMinus, FileSignature } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RHPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const user = session.user as any;
  if (user.role !== "ADMIN" && !user.permissions?.allowRh) {
    redirect("/");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recursos Humanos (RH)</h1>
          <p className={styles.subtitle}>Gerencie admissões, demissões e contratos de colaboradores.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        {/* Card Admissão */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#0ea5e9' }}>
            <UserPlus size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>Processo de Admissão</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Inicie a admissão de novos colaboradores, gere o contrato e altere o status para Ativo.
          </p>
          <Link href="/rh/admissao" style={{ background: '#0ea5e9', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, width: '100%' }}>
            Iniciar Admissão
          </Link>
        </div>

        {/* Card Demissão */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#ef4444' }}>
            <UserMinus size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>Processo de Demissão</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Inicie o desligamento, gere o distrato, assine o documento e libere as alocações.
          </p>
          <Link href="/rh/demissao" style={{ background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, width: '100%' }}>
            Iniciar Demissão
          </Link>
        </div>

      </div>
    </div>
  );
}
