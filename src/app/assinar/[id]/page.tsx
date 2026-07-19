import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SignatureForm from "./SignatureForm";
import { FileSignature, ShieldCheck } from "lucide-react";

export default async function AssinarDocumentoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const doc = await prisma.signedDocument.findUnique({
    where: { id },
    include: {
      employee: { include: { user: true } }
    }
  });

  if (!doc) {
    return notFound();
  }

  if (doc.status === "SIGNED") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6fa', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', background: '#eafaf1', color: '#27ae60', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <ShieldCheck size={48} />
          </div>
          <h2 style={{ color: '#2c3e50', margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 700 }}>Documento Já Assinado!</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
            Este termo de recebimento/prestação de serviços já foi devidamente assinado eletronicamente e está arquivado com sucesso no sistema.
          </p>
          <div style={{ fontSize: '0.8rem', color: '#888', background: '#fafafa', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
            Assinado em {doc.signedAt?.toLocaleDateString('pt-BR')} às {doc.signedAt?.toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6fa', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#003366', borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <FileSignature size={28} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Assinatura Digital de Termo</h2>
            <span style={{ fontSize: '0.75rem', color: '#777' }}>AERP - Sistema de Gestão e Auditoria</span>
          </div>
        </div>

        {/* Titulo do documento */}
        <h3 style={{ fontSize: '0.95rem', color: '#2c3e50', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
          {doc.title}
        </h3>

        {/* Visualização de leitura do documento */}
        <div 
          style={{ 
            maxHeight: '220px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            padding: '1.2rem', 
            background: '#fafafa', 
            borderRadius: '8px', 
            fontSize: '0.88rem', 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.6',
            color: '#2c3e50',
            marginBottom: '1.5rem',
            textAlign: 'justify'
          }}
        >
          {doc.content}
        </div>

        {/* Formulário de Assinatura */}
        <SignatureForm documentId={doc.id} />

      </div>
    </div>
  );
}
