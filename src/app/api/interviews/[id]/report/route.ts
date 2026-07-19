import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Não autorizado.", { status: 401 });
  }

  const interviewId = params.id;

  try {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        employee: {
          include: { user: true }
        }
      }
    });

    if (!interview) {
      return new NextResponse("Entrevista não encontrada.", { status: 404 });
    }

    const employeeName = interview.employee.user?.name || `${interview.employee.firstName} ${interview.employee.lastName || ""}`.trim();
    const interviewDateFormatted = new Date(interview.interviewDate).toLocaleString("pt-BR");
    const reportDateStr = new Date().toLocaleDateString("pt-BR");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Entrevista - ${employeeName}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background-color: #f5f5f5;
          }
          .page {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 50px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            box-sizing: border-box;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #003366;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title-area h1 {
            font-size: 20px;
            color: #003366;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .title-area p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #666;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #003366;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            color: #003366;
            background: #eef3f8;
            padding: 6px 12px;
            margin-top: 30px;
            margin-bottom: 15px;
            border-left: 4px solid #003366;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 30px;
            margin-bottom: 20px;
          }
          .field-label {
            font-size: 11px;
            color: #777;
            text-transform: uppercase;
            font-weight: 600;
          }
          .field-value {
            font-size: 14px;
            color: #111;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
          }
          .badge-contrato {
            background-color: #e8f8f0;
            color: #27ae60;
            border: 1px solid #27ae60;
          }
          .badge-analise {
            background-color: #fef5e7;
            color: #f39c12;
            border: 1px solid #f39c12;
          }
          .badge-negado {
            background-color: #fdedec;
            color: #e74c3c;
            border: 1px solid #e74c3c;
          }
          .content-block {
            font-size: 14px;
            color: #444;
            white-space: pre-wrap;
            background: #fdfdfd;
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 6px;
            min-height: 100px;
          }
          .signatures {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            gap: 50px;
          }
          .sig-line {
            flex: 1;
            text-align: center;
            border-top: 1px solid #999;
            padding-top: 8px;
            font-size: 12px;
            color: #555;
          }
          .no-print {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-btn {
            background-color: #003366;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,51,102,0.15);
            transition: background 0.2s;
          }
          .print-btn:hover {
            background-color: #002244;
          }

          @media print {
            body {
              background-color: #fff;
              padding: 0;
            }
            .page {
              box-shadow: none;
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
        </div>

        <div class="page">
          <div class="header-container">
            <div class="title-area">
              <h1>Relatório de Entrevista e Contratação</h1>
              <p>Gerado em ${reportDateStr} • Sistema AERP</p>
            </div>
            <div class="logo">AERP</div>
          </div>

          <div class="section-title">Dados do Candidato / Funcionário</div>
          <div class="grid">
            <div>
              <div class="field-label">Nome Completo</div>
              <div class="field-value">${employeeName}</div>
            </div>
            <div>
              <div class="field-label">CPF</div>
              <div class="field-value">${interview.employee.cpf}</div>
            </div>
            <div>
              <div class="field-label">Cargo Pretendido / Função</div>
              <div class="field-value">${interview.employee.roleTitle}</div>
            </div>
            <div>
              <div class="field-label">Status do Perfil</div>
              <div class="field-value">
                <span class="badge ${
                  interview.status.toLowerCase() === "contrato"
                    ? "badge-contrato"
                    : interview.status.toLowerCase() === "em análise" || interview.status.toLowerCase() === "em analise"
                    ? "badge-analise"
                    : "badge-negado"
                }">${interview.status}</span>
              </div>
            </div>
          </div>

          <div class="section-title">Dados da Entrevista</div>
          <div class="grid">
            <div>
              <div class="field-label">Entrevistador Responsável</div>
              <div class="field-value">${interview.interviewer}</div>
            </div>
            <div>
              <div class="field-label">Data e Hora de Realização</div>
              <div class="field-value">${interviewDateFormatted}</div>
            </div>
          </div>

          <div class="section-title">Pontos Principais / Qualificações</div>
          <div class="content-block">${interview.points}</div>

          <div class="section-title">Relatório Geral da Entrevista</div>
          <div class="content-block" style="min-height: 150px;">${interview.summary}</div>

          <div class="signatures">
            <div class="sig-line">
              <strong>${interview.interviewer}</strong><br>
              Recursos Humanos / Entrevistador
            </div>
            <div class="sig-line">
              <strong>${employeeName}</strong><br>
              Assinatura do Candidato
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  } catch (err) {
    return new NextResponse("Erro ao carregar o relatório.", { status: 500 });
  }
}
