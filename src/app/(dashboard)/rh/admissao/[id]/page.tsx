import React from "react";
import styles from "../../../clientes/clientes.module.css";
import Link from "next/link";
import { ArrowLeft, FileSignature, CheckCircle, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { generateAdmissionContract, confirmAdmission } from "@/actions/rhActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EfetivarAdmissaoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        where: { template: { type: "ADMISSAO" } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!employee) return notFound();

  const admDoc = employee.documents[0]; // Pega o documento mais recente de admissão
  const isSigned = admDoc?.status === "SIGNED";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/rh/admissao" className={styles.backButton} style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Efetivar Admissão</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Contrato e finalização para {employee.firstName}.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', marginTop: '20px' }}>
        
        {/* Passo 1: Gerar Contrato */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <span style={{ background: '#e2e8f0', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>1</span>
            Gerar Contrato
          </h3>
          
          {admDoc ? (
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: '#64748b' }} />
                <span>{admDoc.title}</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Gerado</span>
            </div>
          ) : (
            <div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>O contrato de admissão ainda não foi gerado.</p>
              <form action={async () => {
                "use server";
                await generateAdmissionContract(employee.id);
              }}>
                <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Gerar Contrato
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Passo 2: Assinar */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', opacity: admDoc ? 1 : 0.5 }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <span style={{ background: '#e2e8f0', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>2</span>
            Assinar Documento
          </h3>
          
          {!admDoc ? (
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Gere o contrato primeiro.</p>
          ) : isSigned ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
              <CheckCircle size={20} />
              Contrato Assinado
            </div>
          ) : (
            <div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>O documento precisa ser assinado pelo colaborador.</p>
              <Link href={`/assinar/${admDoc.id}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
                <FileSignature size={18} />
                Abrir Tela de Assinatura
              </Link>
            </div>
          )}
        </div>

        {/* Passo 3: Efetivar */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', opacity: isSigned ? 1 : 0.5 }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <span style={{ background: '#e2e8f0', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>3</span>
            Efetivar Contratação
          </h3>
          
          {!isSigned ? (
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Aguardando assinatura para efetivar.</p>
          ) : (
            <div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>Tudo certo! Clique abaixo para tornar o colaborador Ativo no sistema.</p>
              <form action={async () => {
                "use server";
                await confirmAdmission(employee.id);
              }}>
                <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  Confirmar Admissão
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
