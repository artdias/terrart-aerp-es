import styles from "../clientes/clientes.module.css";
import { Plus, Calendar, FileText, CheckCircle2, Building2, Paperclip, Receipt, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PayExpenseForm from "./PayExpenseForm";
import PayInvoiceForm from "./PayInvoiceForm";
import CancelInvoiceForm from "./CancelInvoiceForm";
import PagamentosFuncionariosClient, { EmployeePaymentRow } from "./pagamentos/PagamentosFuncionariosClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: {
    tab?: string;
  };
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFinanceiro) {
    redirect("/");
  }

  const activeTab = searchParams.tab || "faturamento";

  const [faturas, clientes, despesas, employeesRaw] = await Promise.all([
    prisma.invoice.findMany({
      where: activeTab === "historico" ? { status: { not: "PENDING" } } : { status: "PENDING" },
      orderBy: { dueDate: 'asc' },
      include: { client: true }
    }),
    prisma.client.findMany({
      where: { deleted: false }, orderBy: { companyName: 'asc' }
    }),
    prisma.expense.findMany({
      where: activeTab === "historico" ? { status: { not: "PENDING" } } : { status: "PENDING" },
      orderBy: { dueDate: 'asc' }
    }),
    activeTab === "pagamentos"
      ? prisma.employee.findMany({
          where: { deleted: false },
          include: {
            user: { select: { name: true } },
            workplace: {
              include: {
                client: { select: { companyName: true } }
              }
            },
            attachments: {
              where: {
                type: { in: ["PAYMENT_RECEIPT", "SIGNED_NOTE"] }
              },
              orderBy: { createdAt: "desc" }
            }
          },
          orderBy: { firstName: "asc" }
        })
      : Promise.resolve([])
  ]);

  const serializedEmployees: EmployeePaymentRow[] = employeesRaw.map((emp) => {
    const fullName =
      emp.user?.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Sem Nome";

    const paymentReceipts = emp.attachments
      .filter((a) => a.type === "PAYMENT_RECEIPT")
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        type: a.type,
        createdAt: a.createdAt.toISOString()
      }));

    const signedNotes = emp.attachments
      .filter((a) => a.type === "SIGNED_NOTE")
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        type: a.type,
        createdAt: a.createdAt.toISOString()
      }));

    return {
      id: emp.id,
      name: fullName,
      cpf: emp.cpf,
      roleTitle: emp.roleTitle,
      status: emp.status,
      salary: emp.salary,
      pixKey: emp.pixKey,
      clientName: emp.workplace?.client?.companyName || null,
      workplaceName: emp.workplace?.name || null,
      paymentReceipts,
      signedNotes
    };
  });

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financeiro</h1>
          <p className={styles.subtitle}>
            {activeTab === "faturamento"
              ? "Gerencie o faturamento, notas fiscais de clientes e contas a receber."
              : activeTab === "pagamentos"
              ? "Anexe aos funcionários os comprovantes de pagamento e as notas assinadas."
              : "Gerencie as contas a pagar, despesas de custeio e compras da empresa."}
          </p>
        </div>
        
        {activeTab === "faturamento" ? (
          <Link href="/financeiro/novo" className={styles.addButton}>
            <Plus size={20} />
            <span>Nova Fatura / Nota</span>
          </Link>
        ) : activeTab === "pagamentos" ? null : (
          <Link href="/financeiro/despesa" className={styles.addButton} style={{ backgroundColor: '#c0392b' }}>
            <Plus size={20} />
            <span>Nova Despesa</span>
          </Link>
        )}
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '2px solid #eee', marginBottom: '1.5rem', paddingBottom: '0.1rem' }}>
        <Link 
          href="/financeiro?tab=faturamento" 
          style={{ 
            fontSize: '1.05rem', 
            fontWeight: 600, 
            color: activeTab === 'faturamento' ? 'var(--primary-color)' : '#777', 
            textDecoration: 'none',
            borderBottom: activeTab === 'faturamento' ? '3px solid var(--primary-color)' : '3px solid transparent',
            paddingBottom: '0.6rem',
            paddingRight: '1.5rem',
            paddingLeft: '1.5rem',
            transition: 'all 0.2s'
          }}
        >
          Contas a Receber (Faturamento / Notas)
        </Link>
        <Link 
          href="/financeiro?tab=despesas" 
          style={{ 
            fontSize: '1.05rem', 
            fontWeight: 600, 
            color: activeTab === 'despesas' ? '#c0392b' : '#777', 
            textDecoration: 'none',
            borderBottom: activeTab === 'despesas' ? '3px solid #c0392b' : '3px solid transparent',
            paddingBottom: '0.6rem',
            paddingRight: '1.5rem',
            paddingLeft: '1.5rem',
            transition: 'all 0.2s'
          }}
        >
          Contas a Pagar (Despesas)
        </Link>
        <Link 
          href="/financeiro?tab=pagamentos" 
          style={{ 
            fontSize: '1.05rem', 
            fontWeight: 600, 
            color: activeTab === 'pagamentos' ? '#0284c7' : '#777', 
            textDecoration: 'none',
            borderBottom: activeTab === 'pagamentos' ? '3px solid #0284c7' : '3px solid transparent',
            paddingBottom: '0.6rem',
            paddingRight: '1.5rem',
            paddingLeft: '1.5rem',
            transition: 'all 0.2s'
          }}
        >
          Pagamentos (Funcionários)
        </Link>
        <Link 
          href="/financeiro?tab=historico" 
          style={{ 
            fontSize: '1.05rem', 
            fontWeight: 600, 
            color: activeTab === 'historico' ? '#27ae60' : '#777', 
            textDecoration: 'none',
            borderBottom: activeTab === 'historico' ? '3px solid #27ae60' : '3px solid transparent',
            paddingBottom: '0.6rem',
            paddingRight: '1.5rem',
            paddingLeft: '1.5rem',
            transition: 'all 0.2s'
          }}
        >
          Histórico (Concluídas)
        </Link>
      </div>

      {activeTab === "pagamentos" && (
        <PagamentosFuncionariosClient initialEmployees={serializedEmployees} embedded />
      )}

      {(activeTab === "faturamento" || activeTab === "historico") && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'start', marginBottom: activeTab === 'historico' ? '3rem' : '0' }}>
          {/* Coluna 1: Faturas Lançadas */}
          <div style={{ flex: '3 1 600px', minWidth: 0 }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
                {activeTab === 'historico' ? "Histórico de Faturas / Notas" : "Faturas e Notas Lançadas"}
              </h2>
            </div>
            <div className={styles.card}>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Nota / Descrição</th>
                      <th>Valor (R$)</th>
                      <th>Data Pagamento</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faturas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          Nenhuma fatura ou nota lançada no sistema ainda.
                        </td>
                      </tr>
                    ) : (
                      faturas.map(fatura => {
                        const due = new Date(fatura.dueDate);
                        const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 0, 0, 0);
                        const isOverdue = fatura.status === "PENDING" && dueMidnight < todayMidnight;

                        return (
                        <tr key={fatura.id}>
                          <td>
                            <Link
                              href={`/clientes/${fatura.clientId}/notas`}
                              style={{ textDecoration: "none", color: "inherit" }}
                              className={styles.strongText}
                            >
                              {fatura.client.companyName}
                            </Link>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div className={styles.cellWithIcon}>
                                <FileText size={16} className={styles.icon} />
                                {fatura.description || "Cobrança Padrão"}
                              </div>
                              {fatura.fileUrl && (
                                <a 
                                  href={fatura.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    fontSize: '0.8rem', 
                                    color: '#003366', 
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    width: 'fit-content'
                                  }}
                                >
                                  <Paperclip size={12} /> Ver Nota ({fatura.fileName || "Anexo"})
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.cellWithIcon}>
                              <strong style={{ fontSize: '1.1rem', color: '#002244' }}>
                                R$ {fatura.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                          </td>
                          <td>
                            <div className={styles.cellWithIcon}>
                              <Calendar size={16} className={styles.icon} />
                              {fatura.dueDate.toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td>
                            {fatura.status === "PAID" ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <CheckCircle2 size={14} /> Pago
                              </div>
                            ) : fatura.status === "CANCELED" ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontWeight: 600, background: '#fdedec', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <AlertCircle size={14} /> Cancelada
                              </div>
                            ) : isOverdue ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b91c1c', fontWeight: 700, background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                <AlertTriangle size={14} /> Não pago na data
                              </div>
                            ) : (
                              <span style={{ color: '#d35400', fontWeight: 600, background: '#fdebd0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>No prazo</span>
                            )}
                          </td>
                          <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {fatura.status !== "PAID" && fatura.status !== "CANCELED" && (
                              <>
                                <PayInvoiceForm invoiceId={fatura.id} />
                                <CancelInvoiceForm invoiceId={fatura.id} />
                              </>
                            )}
                            <Link 
                              href={`/financeiro/fatura/${fatura.id}/editar`}
                              className={styles.actionBtn}
                              style={{ background: '#f39c12', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              Editar
                            </Link>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coluna 2: Clientes Cadastrados (Oculta no Histórico) */}
          {activeTab !== "historico" && (
            <div style={{ flex: '2 1 400px', minWidth: 0 }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>Notas por Cliente</h2>
            </div>
            <div className={styles.card}>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.length === 0 ? (
                      <tr>
                        <td colSpan={2} className={styles.emptyState}>
                          Nenhum cliente cadastrado ainda.
                        </td>
                      </tr>
                    ) : (
                      clientes.map(cliente => (
                        <tr key={cliente.id}>
                          <td>
                            <div className={styles.cellWithIcon}>
                              <Building2 size={16} className={styles.icon} />
                              <div>
                                <div className={styles.strongText}>{cliente.companyName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#777' }}>CNPJ: {cliente.cnpj}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Link 
                                href={`/clientes/${cliente.id}/notas`} 
                                className={styles.actionBtn}
                                style={{ background: '#0284c7', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                              >
                                <Receipt size={14} /> Notas do Mês
                              </Link>
                              <Link 
                                href={`/financeiro/novo?clientId=${cliente.id}`} 
                                className={styles.actionBtn}
                                style={{ textDecoration: 'none', display: 'inline-block', fontSize: '0.8rem' }}
                              >
                                Nova Fatura
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {(activeTab === "despesas" || activeTab === "historico") && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c0392b', margin: 0 }}>
              {activeTab === 'historico' ? "Histórico de Despesas" : "Despesas e Contas a Pagar"}
            </h2>
          </div>
          <div className={styles.card}>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Valor (R$)</th>
                    <th>Vencimento</th>
                    <th>Comprovantes</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyState}>
                        Nenhuma despesa lançada no sistema ainda.
                      </td>
                    </tr>
                  ) : (
                    despesas.map(despesa => (
                      <tr key={despesa.id}>
                        <td>
                          <span 
                            style={{ 
                              display: 'inline-block', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem', 
                              fontWeight: 600, 
                              background: '#f5f5f5', 
                              color: '#555',
                              border: '1px solid #ddd'
                            }}
                          >
                            {despesa.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.strongText}>{despesa.description}</span>
                            {despesa.isInventoryItem && (
                              <span style={{ fontSize: '0.75rem', color: '#2980b9', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                                <Receipt size={12} /> Compra de material ({despesa.quantity} un)
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '1.1rem', color: '#c0392b' }}>
                            R$ {despesa.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td>
                          <div className={styles.cellWithIcon}>
                            <Calendar size={16} className={styles.icon} />
                            {despesa.dueDate.toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {despesa.billUrl ? (
                              <a 
                                href={despesa.billUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#2980b9', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <FileText size={12} /> Conta/Nota Fiscal
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic' }}>Sem Nota/Conta</span>
                            )}

                            {despesa.receiptUrl ? (
                              <a 
                                href={despesa.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#27ae60', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <Paperclip size={12} /> Comprovante
                              </a>
                            ) : (
                              despesa.status === "PAID" && (
                                <span style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>Pago sem comprovante</span>
                              )
                            )}
                          </div>
                        </td>
                        <td>
                          {despesa.status === "PAID" ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#27ae60', fontWeight: 600, background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <CheckCircle2 size={14} /> Pago
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#c0392b', fontWeight: 600, background: '#fadbd8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <AlertCircle size={14} /> Pendente
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {despesa.status === "PENDING" && (
                              <PayExpenseForm expenseId={despesa.id} />
                            )}
                            <Link 
                              href={`/financeiro/despesa/${despesa.id}/editar`}
                              className={styles.actionBtn}
                              style={{ background: '#f39c12', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              Editar
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
