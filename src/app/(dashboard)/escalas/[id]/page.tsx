import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, Edit2, Users, Briefcase, CalendarClock, DollarSign, Info, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { concludeAllocation } from "@/actions/allocationActions";
import { getAllocationStatus } from "@/lib/allocationStatus";
import ConcludeOrCancelModal from "@/components/ConcludeOrCancelModal";

export default async function EscalaDetalhePage({ params }: { params: { id: string } }) {
  const aloc = await prisma.jobAllocation.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { user: true } },
      client: true
    }
  });

  if (!aloc) {
    return notFound();
  }

  const computedStatus = getAllocationStatus(aloc as any);

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/escalas" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Detalhes da Alocação</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Contrato operacional de prestação de serviços.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {computedStatus !== "Concluída" && computedStatus !== "Cancelada" && computedStatus !== "Incompleto" && (
            <ConcludeOrCancelModal allocationId={aloc.id} />
          )}
          <Link 
            href={`/escalas/${aloc.id}/editar`} 
            className={styles.submitBtn} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', textDecoration: 'none', background: '#e67e22' }}
          >
            <Edit2 size={16} />
            <span>Editar Alocação</span>
          </Link>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: '24px', padding: '24px' }}>
        {aloc.status === "Cancelada" && aloc.cancellationReason && (
          <div style={{ background: '#fdedec', border: '1px solid #e74c3c', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ color: '#c0392b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Motivo do Cancelamento
            </h4>
            <p style={{ margin: 0, color: '#e74c3c', fontWeight: 500 }}>{aloc.cancellationReason}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '20px' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={20} style={{ color: '#002244' }} /> Informações Gerais da Escala
          </h3>
          <div>
            {computedStatus === "Ativa" ? (
              <span style={{ color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>Ativa</span>
            ) : computedStatus === "Concluída" ? (
              <span style={{ color: '#2980b9', fontWeight: 600, background: '#ebf5fb', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>Concluída</span>
            ) : computedStatus === "Expirado" ? (
              <span style={{ color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>Expirado</span>
            ) : computedStatus === "Incompleto" ? (
              <span style={{ color: '#f39c12', fontWeight: 600, background: '#fef5e7', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>Incompleto</span>
            ) : (
              <span style={{ color: '#7f8c8d', fontWeight: 600, background: '#f2f4f4', padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>{computedStatus}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Lado 1 - Envolvidos */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} style={{ color: '#666' }} /> Funcionário
            </h4>
            <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee', marginBottom: '20px' }}>
              <strong style={{ fontSize: '1rem', color: '#1a1a1a' }}>{aloc.employee.user?.name || aloc.employee.firstName}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>Função: {aloc.employee.roleTitle}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#666' }}>CPF: {aloc.employee.cpf}</p>
            </div>

            <h4 style={{ margin: '0 0 12px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={16} style={{ color: '#666' }} /> Cliente (Local de Trabalho)
            </h4>
            <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
              <strong style={{ fontSize: '1rem', color: '#1a1a1a' }}>{aloc.client.companyName}</strong>
              {aloc.client.name && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>Nome Fantasia: {aloc.client.name}</p>}
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#666' }}>Endereço: {aloc.client.address}</p>
              {aloc.client.cep && <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#666' }}>CEP: {aloc.client.cep}</p>}
            </div>
          </div>

          {/* Lado 2 - Contrato */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarClock size={16} style={{ color: '#666' }} /> Tarefa & Tempo
            </h4>
            <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee', marginBottom: '20px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#666' }}>Tarefa Designada:</strong>
              <p style={{ margin: '4px 0 12px', fontWeight: 600, color: '#1a1a1a', fontSize: '1.05rem' }}>{aloc.task}</p>
              
              <strong style={{ fontSize: '0.95rem', color: '#666' }}>Período / Tempo Estimado:</strong>
              {aloc.startDate && aloc.endDate && (
                <p style={{ margin: '4px 0 8px', fontWeight: 600, color: '#1a1a1a' }}>
                  De: {new Date(aloc.startDate).toLocaleString('pt-BR')} <br/>
                  Até: {new Date(aloc.endDate).toLocaleString('pt-BR')}
                </p>
              )}
              {aloc.duration && (
                <p style={{ margin: '4px 0 0', color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>{aloc.duration}</p>
              )}
            </div>

            <h4 style={{ margin: '0 0 12px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} style={{ color: '#666' }} /> Custos & Remuneração
            </h4>
            <div style={{ padding: '16px', background: '#eafaf1', borderRadius: '8px', border: '1px solid #d4efdf' }}>
              <strong style={{ fontSize: '0.95rem', color: '#27ae60' }}>Valor Acertado:</strong>
              <p style={{ margin: '6px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#27ae60' }}>
                R$ {aloc.paymentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#555', marginLeft: '6px' }}>
                  / por {aloc.paymentFrequency}
                </span>
              </p>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '16px', fontStyle: 'italic' }}>
              Cadastrado em: {aloc.createdAt.toLocaleString('pt-BR')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
