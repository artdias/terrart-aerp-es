import styles from "../../clientes/novo/novoCliente.module.css";
import detailStyles from "../funcionarios.module.css"; // We'll add some styles to style this page beautifully or write inline
import Link from "next/link";
import { ArrowLeft, Edit2, Users, Briefcase, FileText, CalendarClock, Shield, Paperclip, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InterviewModal from "@/components/InterviewModal";

export default async function FuncionarioDetalhePage({ params }: { params: { id: string } }) {
  const func = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      workplace: { include: { client: true } },
      jobAllocations: {
        orderBy: { createdAt: 'desc' },
        include: { client: true }
      },
      equipments: {
        orderBy: { borrowedAt: 'desc' },
        include: { product: true }
      },
      attachments: {
        orderBy: { createdAt: 'desc' }
      },
      interviews: {
        orderBy: { interviewDate: 'desc' }
      }
    }
  });

  if (!func) {
    return notFound();
  }

  // Filtrar os anexos por tipo
  const certificados = func.attachments.filter(a => a.type === "CERTIFICATE");
  const documentos = func.attachments.filter(a => a.type === "DOCUMENT");

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/funcionarios" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Ficha do Colaborador</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Visualização completa do perfil do funcionário.</p>
          </div>
        </div>

        <Link 
          href={`/funcionarios/${func.id}/editar`} 
          className={styles.submitBtn} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', textDecoration: 'none', background: '#e67e22' }}
        >
          <Edit2 size={16} />
          <span>Editar Cadastro</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginTop: '24px' }}>
        
        {/* Lado Esquerdo - Detalhes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1 - Informações Básicas */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: '#002244' }} /> Dados Pessoais e Funcionais
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Nome Completo:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>
                  {func.user?.name || `${func.firstName} ${func.lastName || ''}`}
                </p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>E-mail (Login):</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{func.user?.email || "Sem e-mail"}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>CPF:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{func.cpf}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>RG:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>
                  {func.rg || "Não cadastrado"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>CNH:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>
                  {func.cnh || "Não cadastrado"} {func.cnhExpiration ? `(Val: ${new Date(func.cnhExpiration).toLocaleDateString('pt-BR')})` : ""}
                </p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Data de Nascimento:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>
                  {func.birthDate ? new Date(func.birthDate).toLocaleDateString('pt-BR') : "Não informado"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Sexo:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{func.gender || "Não informado"}</p>
              </div>
              <div>
                <strong style={{ color: '#666', fontSize: '0.85rem' }}>Escolaridade:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1a1a1a' }}>{func.educationLevel || "Não informado"}</p>
              </div>
            </div>
          </div>

          {/* Card 2 - Anexos */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: '#002244' }} /> Documentação & Anexos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              {/* Certificados */}
              <div>
                <h4 style={{ color: '#555', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Certificados</h4>
                {certificados.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Nenhum certificado anexado.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {certificados.map((a) => (
                      <a 
                        key={a.id} 
                        href={a.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', textDecoration: 'none', color: '#0f172a' }}
                      >
                        <Paperclip size={16} style={{ color: '#64748b' }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{a.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentos Pessoais */}
              <div>
                <h4 style={{ color: '#555', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Documentos Pessoais</h4>
                {documentos.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Nenhum documento anexado.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {documentos.map((a) => (
                      <a 
                        key={a.id} 
                        href={a.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', textDecoration: 'none', color: '#0f172a' }}
                      >
                        <Paperclip size={16} style={{ color: '#64748b' }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{a.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3 - Histórico de Alocações */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarClock size={18} style={{ color: '#002244' }} /> Contratos & Histórico de Alocações
            </h3>
            {func.jobAllocations.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic', marginTop: '16px' }}>
                Este funcionário ainda não possui contratos de escala ou alocações de postos registradas.
              </p>
            ) : (
              <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '8px' }}>Cliente</th>
                      <th style={{ padding: '8px' }}>Tarefa</th>
                      <th style={{ padding: '8px' }}>Tempo</th>
                      <th style={{ padding: '8px' }}>Remuneração</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {func.jobAllocations.map((alloc) => (
                      <tr key={alloc.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{alloc.client.companyName}</td>
                        <td style={{ padding: '8px' }}>{alloc.task}</td>
                        <td style={{ padding: '8px', color: '#666' }}>{alloc.duration || "N/A"}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>
                          R$ {alloc.paymentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {alloc.paymentFrequency}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ color: alloc.status === "Ativa" ? '#27ae60' : '#7f8c8d', fontWeight: 600 }}>
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Histórico de Entrevistas e Seleção */}
          <div className={styles.card} style={{ marginTop: '24px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#002244', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: "#003366" }} />
                Histórico de Entrevistas e Contratação
              </h3>
              <InterviewModal employeeId={func.id} />
            </div>

            {func.interviews.length === 0 ? (
              <p style={{ margin: 0, color: '#888', fontStyle: 'italic', fontSize: '0.85rem', padding: '10px 0' }}>
                Nenhuma entrevista registrada para este profissional.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {func.interviews.map((int) => {
                  const intDate = new Date(int.interviewDate).toLocaleString("pt-BR");
                  return (
                    <div key={int.id} style={{ border: '1px solid #eef2f6', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>Entrevistador: {int.interviewer}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Realizada em: {intDate}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: int.status === "Contrato" ? '#e8f8f0' : int.status === "Em Análise" ? '#fef5e7' : '#fdedec',
                            color: int.status === "Contrato" ? '#27ae60' : int.status === "Em Análise" ? '#f39c12' : '#e74c3c',
                            border: `1px solid ${int.status === "Contrato" ? '#27ae60' : int.status === "Em Análise" ? '#f39c12' : '#e74c3c'}`
                          }}>
                            {int.status}
                          </span>
                          
                          <Link 
                            href={`/api/interviews/${int.id}/report`}
                            target="_blank"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              textDecoration: 'none'
                            }}
                          >
                            <Printer size={12} />
                            Relatório
                          </Link>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                        <div style={{ color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '2px' }}>Pontos Chave / Avaliação:</div>
                        <p style={{ margin: '0 0 8px 0', color: '#334155', lineHeight: '1.4' }}>{int.points}</p>
                        
                        <div style={{ color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '2px' }}>Relatório do Conversado:</div>
                        <p style={{ margin: 0, color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{int.summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito - Sidebar de Status / Alocação Atual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Card Status Atual */}
        <div className={styles.card} style={{ padding: '20px', textAlign: 'center' }}>
          <strong style={{ color: '#666', fontSize: '0.85rem' }}>STATUS DO CONTRATO</strong>
          <div style={{ margin: '12px 0' }}>
            {func.status === "Ativo" || func.status === "Contrato" ? (
              <span style={{ color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '8px 16px', borderRadius: '20px', fontSize: '0.95rem', display: 'inline-block' }}>{func.status}</span>
            ) : func.status === "Inativo" || func.status === "Negado" ? (
              <span style={{ color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '8px 16px', borderRadius: '20px', fontSize: '0.95rem', display: 'inline-block' }}>{func.status}</span>
            ) : func.status === "Ausente" || func.status === "Em Análise" || func.status === "Em Analise" ? (
              <span style={{ color: '#f39c12', fontWeight: 600, background: '#fef5e7', padding: '8px 16px', borderRadius: '20px', fontSize: '0.95rem', display: 'inline-block' }}>{func.status}</span>
            ) : (
              <span style={{ color: '#2980b9', fontWeight: 600, background: '#ebf5fb', padding: '8px 16px', borderRadius: '20px', fontSize: '0.95rem', display: 'inline-block' }}>{func.status}</span>
            )}
          </div>
            <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
              <strong style={{ color: '#666', fontSize: '0.85rem' }}>CARGO ATUAL</strong>
              <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: '1.1rem', color: '#002244' }}>{func.roleTitle}</p>
            </div>
          </div>

          {/* Card Alocação Atual de Posto */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={16} style={{ color: '#002244' }} /> Posto Principal
            </h4>
            {func.workplace ? (
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#1a1a1a' }}>{func.workplace.client.companyName}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#666' }}>Posto: {func.workplace.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#666' }}>Loc: {func.workplace.address}</p>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Nenhum posto principal associado.</p>
            )}
          </div>

          {/* Card Cautelas (Equipamentos em Uso) */}
          <div className={styles.card} style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} style={{ color: '#002244' }} /> Cautelas / Materiais em Uso
            </h4>
            {func.equipments.filter(e => e.status === "EM USO").length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Nenhum material pendente de devolução.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {func.equipments.filter(e => e.status === "EM USO").map((e) => (
                  <div key={e.id} style={{ padding: '8px', background: '#fef5e7', border: '1px solid #fdebd0', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: '#d35400' }}>{e.product.name}</strong>
                    <div style={{ color: '#555', marginTop: '2px' }}>Qtd: {e.quantity} {e.product.unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
