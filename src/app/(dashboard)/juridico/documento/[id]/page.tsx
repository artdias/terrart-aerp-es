import { prisma } from "@/lib/prisma";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, ShieldCheck, User } from "lucide-react";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export default async function DocumentoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const doc = await prisma.signedDocument.findUnique({
    where: { id },
    include: {
      employee: { include: { user: true } },
      client: true,
      equipments: { include: { product: true } }
    }
  });

  if (!doc) {
    return notFound();
  }

  return (
    <div className={styles.container}>
      
      {/* Botões superiores ocultados na impressão */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/juridico" className={styles.backButton} style={{ margin: 0 }}>
          <ArrowLeft size={20} />
          <span>Voltar ao Jurídico</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <PrintButton />
          {doc.status !== "SIGNED" && (
            <Link 
              href={`/assinar/${doc.id}`}
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#27ae60",
                color: "white",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem"
              }}
            >
              Tela de Assinatura
            </Link>
          )}
        </div>
      </div>

      {/* Estilo CSS especial para Impressão */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .document-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Detalhes do Documento */}
      <div className="document-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #ddd', padding: '3.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Timbre da Empresa */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #002244', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ color: '#002244', margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>AERP - SISTEMA WEB DE GESTÃO</h2>
          <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Auditoria Jurídica & Controle Operacional</span>
        </div>

        {/* Título */}
        <h3 style={{ textAlign: 'center', color: '#333', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2.5rem' }}>
          {doc.title}
        </h3>

        {/* Conteúdo do Termo */}
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: '#2c3e50', lineHeight: '1.8', minHeight: '300px', marginBottom: '3rem', textAlign: 'justify', fontFamily: 'serif' }}>
          {doc.content}
        </div>

        {/* Linha de Assinatura */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {doc.status === "SIGNED" ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {doc.signatureType === "DRAWING" && doc.signatureImage ? (
                <div style={{ marginBottom: '10px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={doc.signatureImage} 
                    alt="Assinatura Digital" 
                    style={{ maxHeight: '110px', maxWidth: '300px', objectFit: 'contain' }} 
                  />
                </div>
              ) : (
                <div style={{ border: '2px dashed #27ae60', background: '#eafaf1', color: '#27ae60', padding: '12px 24px', borderRadius: '8px', marginBottom: '15px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ShieldCheck size={28} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '4px' }}>Confirmado Eletronicamente</span>
                  <span style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>CPF do signatário: {doc.signerCpf}</span>
                </div>
              )}
              
              <div style={{ width: '250px', borderTop: '1px solid #333', marginTop: '5px', paddingTop: '5px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333' }}>
                  {doc.signerName || doc.employee?.user?.name || doc.employee?.firstName || "Signatário"}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  Assinado em {doc.signedAt?.toLocaleDateString('pt-BR')} às {doc.signedAt?.toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#7f8c8d' }}>
              <div style={{ width: '250px', borderTop: '1px dashed #bbb', paddingBottom: '10px' }}></div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Clock size={16} /> Aguardando Assinatura do Funcionário
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
