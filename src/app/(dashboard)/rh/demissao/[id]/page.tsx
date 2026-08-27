import React from "react";
import styles from "../../../clientes/clientes.module.css";
import Link from "next/link";
import { ArrowLeft, FileSignature, CheckCircle, FileText, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { generateDismissalContract, confirmDismissal } from "@/actions/rhActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EfetivarDemissaoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        where: { template: { type: "DEMISSAO" } },
        orderBy: { createdAt: 'desc' }
      },
      equipments: {
        where: { status: "EM USO" },
        include: { product: true }
      },
      jobAllocations: {
        where: { status: { in: ["Ativa", "Pendente"] } }
      }
    }
  });

  if (!employee) return notFound();

  const admDoc = employee.documents[0]; // Pega o documento mais recente de demissão
  const isSigned = admDoc?.status === "SIGNED";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/rh/demissao" className={styles.backButton} style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Efetivar Demissão</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Distrato e encerramento para {employee.firstName}.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', marginTop: '20px' }}>
        
        {employee.equipments.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px' }}>
            <TriangleAlert size={24} style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>Atenção: Equipamentos em Uso</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#b45309' }}>
                Este funcionário ainda possui <strong>{employee.equipments.length}</strong> equipamento(s)/material(is) em sua posse. Recomenda-se realizar a devolução no módulo de Atribuições antes de concluir a rescisão.
              </p>
              <ul style={{ marginTop: '8px', marginBottom: 0, fontSize: '0.85rem', color: '#b45309', paddingLeft: '20px' }}>
                {employee.equipments.map(eq => (
                  <li key={eq.id}>{eq.product.name} (Qtd: {eq.quantity})</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {employee.jobAllocations.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px' }}>
            <TriangleAlert size={24} style={{ color: '#b91c1c', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#991b1b' }}>Atenção: Alocações Ativas</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#b91c1c' }}>
                Ao efetivar a demissão, <strong>{employee.jobAllocations.length}</strong> alocação(ões) / escala(s) ativas vinculadas a este funcionário serão canceladas automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Passo 1: Gerar Contrato */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <span style={{ background: '#e2e8f0', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>1</span>
            Gerar Termo de Rescisão
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
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>O termo de rescisão de contrato ainda não foi gerado.</p>
              <form action={async () => {
                "use server";
                await generateDismissalContract(employee.id);
              }}>
                <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Gerar Documento
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
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Gere o documento primeiro.</p>
          ) : isSigned ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
              <CheckCircle size={20} />
              Termo Assinado
            </div>
          ) : (
            <div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>O documento precisa ser assinado pelo colaborador e/ou responsável.</p>
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
            Efetivar Demissão
          </h3>
          
          {!isSigned ? (
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Aguardando assinatura para efetivar.</p>
          ) : (
            <div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>Tudo certo! Clique abaixo para desligar o funcionário, marcá-lo como Inativo e remover suas escalas pendentes/ativas.</p>
              <form action={async () => {
                "use server";
                await confirmDismissal(employee.id);
              }}>
                <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  Confirmar Desligamento
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
