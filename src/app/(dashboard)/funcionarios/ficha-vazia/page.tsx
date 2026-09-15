"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export default function FichaVaziaPage() {
  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", padding: "20px", fontFamily: "Arial, sans-serif", color: "#1e293b" }}>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }

        .print-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .print-header img {
          max-height: 70px;
          object-fit: contain;
          margin-bottom: 8px;
        }

        .print-header h1 {
          font-size: 18px;
          color: #1f3b58;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: bold;
        }

        .print-section-title {
          background-color: #1f3b58 !important;
          color: white !important;
          padding: 5px 10px !important;
          font-size: 11px !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          margin: 14px 0 8px 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 6px;
          margin-bottom: 6px;
        }

        .print-box {
          border: 1px solid #b0b0b0;
          padding: 6px 8px;
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          min-height: 44px;
          background: white;
          box-sizing: border-box;
        }

        .print-box label {
          font-size: 9px;
          font-weight: bold;
          color: #333;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .print-box span {
          font-size: 11px;
          color: #555;
        }

        .col-12 { grid-column: span 12; }
        .col-8 { grid-column: span 8; }
        .col-6 { grid-column: span 6; }
        .col-4 { grid-column: span 4; }
        .col-3 { grid-column: span 3; }
      `}</style>

      {/* Botão visível apenas em tela para teste direto */}
      <div className="no-print" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>Modelo de Impressão: Ficha Cadastral Vazia</h2>
        <button
          onClick={() => window.print()}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Printer size={18} />
          Imprimir / Gerar PDF
        </button>
      </div>

      <div className="print-container">
        {/* Cabeçalho */}
        <div className="print-header">
          <img src="/logo.png" alt="Logo AERP" />
          <h1>Ficha Cadastral do Colaborador</h1>
        </div>

        {/* SEÇÃO 01 - DADOS PESSOAIS */}
        <div className="print-section-title">01 • DADOS PESSOAIS</div>

        <div className="print-grid">
          <div className="print-box col-12">
            <label>Nome Completo</label>
            <span></span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-12">
            <label>Endereço Residencial Completo (Rua, Nº, Bairro, Cidade - UF, CEP)</label>
            <span></span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-6">
            <label>CPF</label>
            <span></span>
          </div>
          <div className="print-box col-6">
            <label>RG / Órgão Emissor</label>
            <span></span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-6">
            <label>Carteira de Motorista (CNH)</label>
            <span></span>
          </div>
          <div className="print-box col-6">
            <label>Validade da CNH</label>
            <span>____ / ____ / ________</span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-4">
            <label>Data de Nascimento</label>
            <span>____ / ____ / ________</span>
          </div>
          <div className="print-box col-4">
            <label>Sexo</label>
            <span>[  ] Masculino   [  ] Feminino   [  ] Outro</span>
          </div>
          <div className="print-box col-4">
            <label>Escolaridade</label>
            <span></span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-12" style={{ minHeight: "80px" }}>
            <label>Experiências Anteriores (Últimos empregos, empresas e cargos)</label>
            <span></span>
          </div>
        </div>

        {/* SEÇÃO 02 - DADOS DE CONTRATO & SISTEMA */}
        <div className="print-section-title">02 • DADOS DE CONTRATO & SISTEMA</div>

        <div className="print-grid">
          <div className="print-box col-6">
            <label>E-mail de Contato</label>
            <span></span>
          </div>
          <div className="print-box col-6">
            <label>Cargo / Função Pretendida</label>
            <span></span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-6">
            <label>Salário Base / Pretensão (R$)</label>
            <span></span>
          </div>
          <div className="print-box col-6">
            <label>Jornada de Trabalho Pretendida</label>
            <span></span>
          </div>
        </div>

        <div className="print-grid">
          <div className="print-box col-6">
            <label>Cobertura de Faltas / Plantão</label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "10px" }}>
              <div style={{ width: "12px", height: "12px", border: "1px solid #333" }}></div>
              <span>Disponível para cobrir faltas/plantão fora da escala</span>
            </div>
          </div>
          <div className="print-box col-6">
            <label>Disponibilidade de Viagens</label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "10px" }}>
              <div style={{ width: "12px", height: "12px", border: "1px solid #333" }}></div>
              <span>Disponibilidade de fazer viagens</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 03 - TERMO LGPD & ASSINATURA */}
        <div className="print-section-title">03 • TERMO DE CONSENTIMENTO — LGPD</div>

        <div className="print-grid">
          <div className="print-box col-12" style={{ minHeight: "75px", padding: "8px" }}>
            <p style={{ fontSize: "10px", textAlign: "justify", lineHeight: "1.4", margin: 0, color: "#333" }}>
              Declaro que as informações acima são verdadeiras e consinto expressamente, de forma livre e informada, com a coleta, uso, armazenamento e tratamento dos meus dados pessoais e dados pessoais sensíveis pela Elite Soluções, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), para a finalidade exclusiva de participação em processo seletivo, avaliação de currículo e possíveis contratações futuras. Compreendo que posso revogar este consentimento a qualquer momento, mediante solicitação formal.
            </p>
          </div>
        </div>

        <div className="print-grid" style={{ marginTop: "10px" }}>
          <div className="print-box col-6" style={{ height: "90px", position: "relative" }}>
            <label>Local e Data</label>
            <div style={{ position: "absolute", bottom: "12px", left: "10px", right: "10px", borderBottom: "1px solid #777" }}></div>
          </div>
          <div className="print-box col-6" style={{ height: "90px", position: "relative" }}>
            <label>Assinatura do(a) Candidato(a)</label>
            <div style={{ position: "absolute", bottom: "12px", left: "10px", right: "10px", borderBottom: "1px solid #777" }}></div>
          </div>
        </div>

        <div className="print-grid" style={{ marginTop: "10px" }}>
          <div className="print-box col-12" style={{ minHeight: "50px", background: "#fcfcfc" }}>
            <label>Uso Administrativo</label>
            <span style={{ fontSize: "9px", color: "#666" }}>Espaço reservado para conferência, observações ou protocolo.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
