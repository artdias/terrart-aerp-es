import styles from "../clientes/clientes.module.css";
import { Scale, FileText, CheckCircle, Clock, Edit3, ArrowRight, ShieldCheck, FileSignature, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function JuridicoPage({
  searchParams,
}: {
  searchParams: { tab?: string; search?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowJuridico) {
    redirect("/");
  }

  const tab = searchParams?.tab || "templates";
  const search = searchParams?.search || "";

  // 1. Garantir que os modelos padrão existam no banco de dados
  const defaultTemplates = [
    {
      type: "RETIRADA",
      title: "Termo de Entrega e Responsabilidade de Materiais",
      content: `DECLARAÇÃO DE RECEBIMENTO DE EQUIPAMENTOS E MATERIAIS\n\nEu, {{nome_funcionario}}, portador do CPF nº {{cpf_funcionario}}, declaro para os devidos fins que recebi da empresa AERP os seguintes materiais/EPIs em perfeito estado de conservação:\n\n{{lista_itens}}\n\nComprometo-me a zelar pelo bom uso e conservação dos mesmos, sob pena de ressarcimento em caso de perda ou dano decorrente de uso inadequado.\n\nData: {{data}}`
    },
    {
      type: "ADMISSAO",
      title: "Contrato de Admissão e Trabalho Terceirizado",
      content: `CONTRATO DE ADMISSÃO E PRESTAÇÃO DE SERVIÇOS TERCEIRIZADOS\n\nPor este instrumento, a empresa AERP contrata o funcionário {{nome_funcionario}}, CPF {{cpf_funcionario}}, para exercer a função de {{cargo_funcionario}}.\n\nO contratado compromete-se a cumprir as jornadas estabelecidas e as normas internas da empresa, recebendo a remuneração condizente com o cargo.\n\nData: {{data}}`
    },
    {
      type: "DEMISSAO",
      title: "Termo de Rescisão e Desligamento de Contrato",
      content: `TERMO DE RESCISÃO E DESLIGAMENTO DE CONTRATO\n\nDeclaramos que encerra-se o vínculo de prestação de serviços entre a empresa AERP e o funcionário {{nome_funcionario}}, CPF {{cpf_funcionario}}.\n\nAs partes dão plena, geral e irrevogável quitação de todas as obrigações contratuais.\n\nData de Desligamento: {{data}}`
    },
    {
      type: "CONTRATO_CLIENTE",
      title: "Contrato de Prestação de Serviços (Cliente)",
      content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TERCEIRIZAÇÃO\n\nContratante: {{nome_cliente}}, CNPJ nº {{cnpj_cliente}}, sediada em {{endereco_cliente}}.\n\nContratada: AERP - SISTEMA WEB DE GESTÃO.\n\nObjeto: Prestação de serviços de mão de obra terceirizada conforme as escalas e alocações definidas no sistema.\n\nData: {{data}}`
    }
  ];

  for (const t of defaultTemplates) {
    const exists = await prisma.documentTemplate.findUnique({ where: { type: t.type } });
    if (!exists) {
      await prisma.documentTemplate.create({ data: t });
    }
  }

  // 2. Buscar templates
  const templates = await prisma.documentTemplate.findMany({
    orderBy: { type: 'asc' }
  });

  // 3. Condicional de dados conforme a aba ativa
  let signedDocuments: any[] = [];
  let employees: any[] = [];
  let clients: any[] = [];

  if (tab === "auditoria") {
    signedDocuments = await prisma.signedDocument.findMany({
      where: search ? {
        OR: [
          { title: { contains: search } },
          { employee: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { user: { name: { contains: search } } }
            ]
          } },
          { client: { companyName: { contains: search } } }
        ]
      } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { include: { user: true } },
        client: true
      }
    });
  } else if (tab === "consulta-funcionarios") {
    employees = await prisma.employee.findMany({
      where: { deleted: false,
        ...(search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { cpf: { contains: search } },
            { roleTitle: { contains: search } },
            { user: { name: { contains: search } } }
          ]
        } : {})
      },
      include: { user: true },
      orderBy: { firstName: 'asc' }
    });
  } else if (tab === "consulta-clientes") {
    clients = await prisma.client.findMany({
      where: { deleted: false,
        ...(search ? {
          OR: [
            { companyName: { contains: search } },
            { cnpj: { contains: search } },
            { address: { contains: search } },
            { managerName: { contains: search } }
          ]
        } : {})
      },
      orderBy: { companyName: 'asc' }
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel Jurídico e Contratos</h1>
          <p className={styles.subtitle}>Gerencie modelos de contratos, termos de responsabilidade e auditoria de assinaturas digitais.</p>
        </div>
        <Link href="/juridico/documento/novo" className={styles.addButton}>
          <FileSignature size={20} />
          <span>Emitir Contrato de Cliente</span>
        </Link>
      </div>

      {/* Navegação por Abas do Jurídico */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link 
          href={`/juridico?tab=templates&search=${search}`}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: tab === "templates" ? '#003366' : 'white',
            color: tab === "templates" ? 'white' : '#555',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          Modelos de Documentos
        </Link>
        <Link 
          href={`/juridico?tab=auditoria&search=${search}`}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: tab === "auditoria" ? '#003366' : 'white',
            color: tab === "auditoria" ? 'white' : '#555',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          Auditoria de Assinaturas
        </Link>
        <Link 
          href={`/juridico?tab=consulta-funcionarios&search=${search}`}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: tab === "consulta-funcionarios" ? '#003366' : 'white',
            color: tab === "consulta-funcionarios" ? 'white' : '#555',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          Consulta de Funcionários
        </Link>
        <Link 
          href={`/juridico?tab=consulta-clientes&search=${search}`}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: tab === "consulta-clientes" ? '#003366' : 'white',
            color: tab === "consulta-clientes" ? 'white' : '#555',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          Consulta de Clientes
        </Link>
      </div>

      {/* Barra de Busca Reativa (se não for a aba de templates) */}
      {tab !== "templates" && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '1.5rem', 
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          border: '1px solid #eee'
        }}>
          <SearchInput placeholder={
            tab === "auditoria" 
              ? "Pesquise por termo, funcionário ou cliente..." 
              : tab === "consulta-funcionarios"
              ? "Pesquise funcionário por nome, CPF ou cargo..."
              : "Pesquise cliente por razão social, CNPJ ou local..."
          } />
          {search ? (
            <Link href={`/juridico?tab=${tab}`} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.85rem', color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>
              Limpar Filtros
            </Link>
          ) : null}
        </div>
      )}

      {/* Conteúdo da Aba Ativa */}
      {tab === "templates" && (
        <>
          <h3 style={{ margin: '1rem 0', color: '#002244', fontSize: '1.25rem', fontWeight: 700 }}>Modelos de Documentos Jurídicos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {templates.map(t => (
              <div key={t.id} style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#003366', marginBottom: '0.8rem' }}>
                    <FileText size={22} />
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t.title}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f39c12', background: '#fef5e7', padding: '3px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {t.type}
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.8rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.content}
                  </p>
                </div>
                <Link 
                  href={`/juridico/template/${t.type}`}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '1.5rem', 
                    color: '#003366', 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <Edit3 size={16} /> Editar Modelo
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "auditoria" && (
        <>
          <h3 style={{ margin: '1rem 0', color: '#002244', fontSize: '1.25rem', fontWeight: 700 }}>Auditoria de Assinaturas</h3>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Beneficiário</th>
                  <th>Data de Geração</th>
                  <th>Status</th>
                  <th>Assinatura / Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {signedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      Nenhum documento gerado para assinatura correspondente.
                    </td>
                  </tr>
                ) : (
                  signedDocuments.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div className={styles.strongText}>{doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#777' }}>ID: {doc.id}</div>
                      </td>
                      <td>
                        {doc.employee ? (
                          <div>
                            <div className={styles.strongText}>{doc.employee.user?.name || doc.employee.firstName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>CPF: {doc.employee.cpf}</div>
                          </div>
                        ) : doc.client ? (
                          <div>
                            <div className={styles.strongText}>{doc.client.companyName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>CNPJ: {doc.client.cnpj}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#aaa', fontStyle: 'italic' }}>Geral / Não atrelado</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{doc.createdAt.toLocaleDateString('pt-BR')}</div>
                      </td>
                      <td>
                        {doc.status === "SIGNED" ? (
                          <span style={{ color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Assinado
                          </span>
                        ) : (
                          <span style={{ color: '#d35400', fontWeight: 600, background: '#fdebd0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} /> Pendente
                          </span>
                        )}
                      </td>
                      <td>
                        {doc.status === "SIGNED" ? (
                          <div style={{ fontSize: '0.8rem', color: '#555' }}>
                            <div>{doc.signatureType === "DRAWING" ? "✍️ Desenho em Tela" : "💻 Confirm. Eletrônica"}</div>
                            <div style={{ color: '#888', fontSize: '0.75rem' }}>Em: {doc.signedAt?.toLocaleDateString('pt-BR')}</div>
                          </div>
                        ) : (
                          <Link 
                            href={`/assinar/${doc.id}`}
                            target="_blank"
                            style={{ color: '#2980b9', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileSignature size={14} /> Assinar Agora
                          </Link>
                        )}
                      </td>
                      <td>
                        <Link 
                          href={`/juridico/documento/${doc.id}`}
                          className={styles.actionBtn}
                          style={{ background: '#003366', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Visualizar <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "consulta-funcionarios" && (
        <>
          <h3 style={{ margin: '1rem 0', color: '#002244', fontSize: '1.25rem', fontWeight: 700 }}>Consulta de Funcionários (Somente Leitura)</h3>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>CPF</th>
                  <th>Cargo / Função</th>
                  <th>Status</th>
                  <th>Data de Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      Nenhum funcionário correspondente encontrado.
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id}>
                      <td className={styles.strongText}>{emp.user?.name || `${emp.firstName} ${emp.lastName}`}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{emp.cpf}</td>
                      <td>{emp.roleTitle || "Terceirizado"}</td>
                      <td>
                        <span style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: emp.status === "Ativo" ? '#e8f8f0' : '#f2f4f4',
                          color: emp.status === "Ativo" ? '#27ae60' : '#7f8c8d',
                          border: `1px solid ${emp.status === "Ativo" ? '#27ae60' : '#7f8c8d'}`
                        }}>
                          {emp.status}
                        </span>
                      </td>
                      <td>{new Date(emp.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <Link 
                          href={`/funcionarios/${emp.id}`}
                          className={styles.actionBtn}
                          style={{ background: '#003366', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
                        >
                          Cadastro Completo
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "consulta-clientes" && (
        <>
          <h3 style={{ margin: '1rem 0', color: '#002244', fontSize: '1.25rem', fontWeight: 700 }}>Consulta de Clientes e Postos (Somente Leitura)</h3>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Razão Social</th>
                  <th>CNPJ</th>
                  <th>Endereço Completo</th>
                  <th>Representante Legal</th>
                  <th>Contato</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      Nenhum cliente correspondente encontrado.
                    </td>
                  </tr>
                ) : (
                  clients.map(c => (
                    <tr key={c.id}>
                      <td className={styles.strongText}>{c.companyName}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.cnpj}</td>
                      <td style={{ fontSize: '0.85rem', color: '#555' }}>{c.address}</td>
                      <td className={styles.strongText}>{c.managerName || "--"}</td>
                      <td>{c.managerContact || "--"}</td>
                      <td>
                        <Link 
                          href={`/clientes/${c.id}`}
                          className={styles.actionBtn}
                          style={{ background: '#003366', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
                        >
                          Cadastro Completo
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
