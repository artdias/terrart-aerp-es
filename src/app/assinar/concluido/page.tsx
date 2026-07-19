import React from "react";
import { CheckCircle } from "lucide-react";

export default function SignatureSuccessPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6fa', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '3rem 2rem', width: '100%', maxWidth: '440px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', background: '#eafaf1', color: '#27ae60', padding: '1.2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <CheckCircle size={54} />
        </div>
        <h2 style={{ color: '#2c3e50', margin: '0 0 0.8rem 0', fontSize: '1.5rem', fontWeight: 700 }}>Assinatura Confirmada!</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
          Sua assinatura digital foi processada e vinculada a este documento com sucesso. O termo foi arquivado com validade jurídica de recebimento.
        </p>
        <div style={{ color: '#999', fontSize: '0.8rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          Você já pode fechar esta janela. Obrigado!
        </div>
      </div>
    </div>
  );
}
