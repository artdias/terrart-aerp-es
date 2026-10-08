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

  const employeeId = params.id;

  try {
    const func = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        workplace: { include: { client: true } },
        jobAllocations: {
          orderBy: { createdAt: "desc" },
          include: { client: true }
        },
        equipments: {
          orderBy: { borrowedAt: "desc" },
          include: { product: true }
        },
        attachments: {
          orderBy: { createdAt: "desc" }
        },
        interviews: {
          orderBy: { interviewDate: "desc" }
        }
      }
    });

    if (!func) {
      return new NextResponse("Funcionário não encontrado.", { status: 404 });
    }

    const employeeName =
      func.user?.name || `${func.firstName || ""} ${func.lastName || ""}`.trim() || "Sem Nome";
    const reportDateStr = new Date().toLocaleDateString("pt-BR");
    const birthDateStr = func.birthDate
      ? new Date(func.birthDate).toLocaleDateString("pt-BR")
      : "Não informado";
    const cnhValStr = func.cnhExpiration
      ? new Date(func.cnhExpiration).toLocaleDateString("pt-BR")
      : "";

    const certificados = func.attachments.filter((a) => a.type === "CERTIFICATE");
    const documentos = func.attachments.filter((a) => a.type === "DOCUMENT");
    const equipmentsInUse = func.equipments.filter((e) => e.status === "EM USO");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Ficha Cadastral do Colaborador - ${employeeName}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 24px;
            background-color: #f8fafc;
          }
          .page {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            padding: 36px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #003366;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title-area h1 {
            font-size: 20px;
            color: #003366;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
          }
          .title-area p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #64748b;
          }
          .header-logo-photo {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .logo {
            font-size: 22px;
            font-weight: 900;
            color: #003366;
          }
          .photo-thumb {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #003366;
          }
          .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #ffffff;
            background: #003366;
            padding: 6px 12px;
            margin-top: 24px;
            margin-bottom: 12px;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 10px 16px;
            margin-bottom: 12px;
          }
          .field {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 4px;
          }
          .field-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .field-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 600;
            word-break: break-word;
          }
          .col-12 { grid-column: span 12; }
          .col-8 { grid-column: span 8; }
          .col-6 { grid-column: span 6; }
          .col-4 { grid-column: span 4; }
          .col-3 { grid-column: span 3; }

          .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 700;
            border-radius: 12px;
            text-transform: uppercase;
          }
          .badge-ativo { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .badge-inativo { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
          .badge-ausente { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
          .badge-entrevista { background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 6px;
          }
          table th {
            background-color: #f1f5f9;
            color: #334155;
            text-transform: uppercase;
            font-size: 10px;
            padding: 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          table td {
            padding: 8px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
          }

          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .sig-line {
            flex: 1;
            text-align: center;
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
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
            box-shadow: 0 4px 12px rgba(0,51,102,0.2);
            transition: all 0.2s;
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
              border: none;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>
        </div>

        <div class="page">
          <!-- CABEÇALHO -->
          <div class="header-container">
            <div class="title-area">
              <h1>Ficha Cadastral do Colaborador</h1>
              <p>Gerado em ${reportDateStr} • Sistema de Gestão AERP</p>
            </div>
            <div class="header-logo-photo">
              ${
                func.photoUrl
                  ? `<img src="${func.photoUrl}" alt="Foto" class="photo-thumb" />`
                  : `<div class="logo">AERP</div>`
              }
            </div>
          </div>

          <!-- SEÇÃO 01: DADOS PESSOAIS E DE CONTATO -->
          <div class="section-title">01 • DADOS PESSOAIS E DE CONTATO</div>
          <div class="grid">
            <div class="field col-8">
              <div class="field-label">Nome Completo</div>
              <div class="field-value">${employeeName}</div>
            </div>
            <div class="field col-4">
              <div class="field-label">Status do Contrato</div>
              <div class="field-value">
                <span class="badge ${
                  func.status === "Ativo"
                    ? "badge-ativo"
                    : func.status === "Inativo" || func.status === "Negado"
                    ? "badge-inativo"
                    : func.status === "Ausente"
                    ? "badge-ausente"
                    : "badge-entrevista"
                }">${func.status}</span>
              </div>
            </div>

            <div class="field col-6">
              <div class="field-label">E-mail (Login de Acesso)</div>
              <div class="field-value">${func.user?.email || "Não cadastrado"}</div>
            </div>
            <div class="field col-6">
              <div class="field-label">Endereço Residencial Completo</div>
              <div class="field-value">${func.address || "Não informado"}</div>
            </div>

            <div class="field col-3">
              <div class="field-label">CPF</div>
              <div class="field-value">${func.cpf}</div>
            </div>
            <div class="field col-3">
              <div class="field-label">RG</div>
              <div class="field-value">${func.rg || "Não cadastrado"}</div>
            </div>
            <div class="field col-6">
              <div class="field-label">Carteira de Motorista (CNH)</div>
              <div class="field-value">
                ${func.cnh || "Não cadastrado"} ${cnhValStr ? `(Validade: ${cnhValStr})` : ""}
              </div>
            </div>

            <div class="field col-4">
              <div class="field-label">Data de Nascimento</div>
              <div class="field-value">${birthDateStr}</div>
            </div>
            <div class="field col-4">
              <div class="field-label">Sexo</div>
              <div class="field-value">${func.gender || "Não informado"}</div>
            </div>
            <div class="field col-4">
              <div class="field-label">Escolaridade</div>
              <div class="field-value">${func.educationLevel || "Não informado"}</div>
            </div>

            <div class="field col-4">
              <div class="field-label">Salário Base / Pretensão</div>
              <div class="field-value">
                ${
                  func.salary !== null && func.salary !== undefined
                    ? `R$ ${func.salary.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "Não cadastrado"
                }
              </div>
            </div>
            <div class="field col-4">
              <div class="field-label">Cobertura de Faltas/Plantão</div>
              <div class="field-value">${func.overtimeAvailability ? "Sim (Disponível)" : "Não"}</div>
            </div>
            <div class="field col-4">
              <div class="field-label">Disponibilidade de Viagens</div>
              <div class="field-value">${func.travelAvailability ? "Sim (Disponível)" : "Não"}</div>
            </div>
          </div>

          <!-- SEÇÃO UNIFORME & CALÇADO -->
          <div class="section-title">02 • UNIFORME, VESTUÁRIO & CALÇADO (TAMANHOS E MEDIDAS)</div>
          <div class="grid">
            <div class="field col-4">
              <div class="field-label">Tamanho do Uniforme / Camisa</div>
              <div class="field-value">${func.uniformSize || "Não informado"}</div>
            </div>
            <div class="field col-4">
              <div class="field-label">Tamanho da Calça / Bermuda</div>
              <div class="field-value">${func.pantsSize || "Não informado"}</div>
            </div>
            <div class="field col-4">
              <div class="field-label">Número do Calçado / Bota</div>
              <div class="field-value">${func.shoeSize || "Não informado"}</div>
            </div>
            ${
              func.uniformMeasurements
                ? `
            <div class="field col-12">
              <div class="field-label">Medidas Detalhadas / Observações do Vestuário</div>
              <div class="field-value" style="font-weight: normal;">${func.uniformMeasurements}</div>
            </div>
            `
                : ""
            }
          </div>

          <!-- SEÇÃO 03: DADOS DE CARGO, POSTO E CRACHÁ -->
          <div class="section-title">03 • CARGO, ALOCAÇÃO & CRACHÁ</div>
          <div class="grid">
            <div class="field col-6">
              <div class="field-label">Cargo Atual / Função</div>
              <div class="field-value">${func.roleTitle}</div>
            </div>
            <div class="field col-6">
              <div class="field-label">Posto Principal Associado</div>
              <div class="field-value">
                ${
                  func.workplace
                    ? `${func.workplace.client.companyName} — ${func.workplace.name}`
                    : "Nenhum posto principal associado"
                }
              </div>
            </div>

            <div class="field col-6">
              <div class="field-label">Código do Crachá / QR Code</div>
              <div class="field-value">${func.badgeCode || "Não cadastrado"}</div>
            </div>
            <div class="field col-6">
              <div class="field-label">Departamento</div>
              <div class="field-value">${func.department || "Não informado"}</div>
            </div>
          </div>

          <!-- SEÇÃO MEI / PJ SE HOUVER -->
          ${
            func.isMei
              ? `
            <div class="section-title">03 • DADOS DA MEI / PESSOA JURÍDICA (PJ)</div>
            <div class="grid">
              <div class="field col-4">
                <div class="field-label">CNPJ da MEI</div>
                <div class="field-value">${func.meiCnpj || "Não informado"}</div>
              </div>
              <div class="field col-4">
                <div class="field-label">Razão Social</div>
                <div class="field-value">${func.meiRazaoSocial || "Não informado"}</div>
              </div>
              <div class="field col-4">
                <div class="field-label">Nome Fantasia</div>
                <div class="field-value">${func.meiNomeFantasia || "Não informado"}</div>
              </div>
              <div class="field col-6">
                <div class="field-label">Inscrição Estadual</div>
                <div class="field-value">${func.meiInscricaoEstadual || "Isento"}</div>
              </div>
              <div class="field col-6">
                <div class="field-label">Inscrição Municipal</div>
                <div class="field-value">${func.meiInscricaoMunicipal || "Isento"}</div>
              </div>
            </div>
          `
              : ""
          }

          <!-- EXPERIÊNCIAS ANTERIORES -->
          <div class="section-title">03 • EXPERIÊNCIAS PROFISSIONAIS ANTERIORES</div>
          <div class="field col-12" style="margin-bottom: 12px;">
            <div class="field-label">Resumo das Experiências</div>
            <div class="field-value" style="white-space: pre-wrap; min-height: 40px;">
              ${func.previousExperience || "Nenhuma experiência anterior registrada no sistema."}
            </div>
          </div>

          <!-- CAUTELAS / MATERIAIS EM USO -->
          <div class="section-title">04 • CAUTELAS & MATERIAIS EM USO</div>
          ${
            equipmentsInUse.length === 0
              ? `<p style="font-size: 12px; color: #64748b; font-style: italic; margin: 4px 0 12px 0;">Nenhum material ou equipamento pendente de devolução.</p>`
              : `
            <table>
              <thead>
                <tr>
                  <th>Material / EPI</th>
                  <th>Quantidade</th>
                  <th>Data de Empréstimo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${equipmentsInUse
                  .map(
                    (eq) => `
                  <tr>
                    <td><strong>${eq.product.name}</strong></td>
                    <td>${eq.quantity} ${eq.product.unit}</td>
                    <td>${new Date(eq.borrowedAt).toLocaleDateString("pt-BR")}</td>
                    <td><span class="badge badge-ausente">${eq.status}</span></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
          }

          <!-- HISTÓRICO DE CONTRATOS & ALOCAÇÕES -->
          <div class="section-title">05 • HISTÓRICO DE CONTRATOS E ALOCAÇÕES</div>
          ${
            func.jobAllocations.length === 0
              ? `<p style="font-size: 12px; color: #64748b; font-style: italic; margin: 4px 0 12px 0;">Nenhuma alocação contratual registrada.</p>`
              : `
            <table>
              <thead>
                <tr>
                  <th>Empresa Cliente</th>
                  <th>Função / Tarefa</th>
                  <th>Duração</th>
                  <th>Remuneração</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${func.jobAllocations
                  .map(
                    (alloc) => `
                  <tr>
                    <td><strong>${alloc.client.companyName}</strong></td>
                    <td>${alloc.task}</td>
                    <td>${alloc.duration || "N/A"}</td>
                    <td>R$ ${alloc.paymentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / ${alloc.paymentFrequency}</td>
                    <td><strong>${alloc.status}</strong></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
          }

          <!-- DOCUMENTOS E ANEXOS -->
          <div class="section-title">06 • DOCUMENTOS E ANEXOS CADASTRADOS</div>
          <div class="grid">
            <div class="field col-6">
              <div class="field-label">Certificados (${certificados.length})</div>
              <div class="field-value" style="font-size: 11px;">
                ${
                  certificados.length > 0
                    ? certificados.map((c) => `• ${c.fileName}`).join("<br/>")
                    : "Nenhum certificado anexado"
                }
              </div>
            </div>
            <div class="field col-6">
              <div class="field-label">Documentos Pessoais (${documentos.length})</div>
              <div class="field-value" style="font-size: 11px;">
                ${
                  documentos.length > 0
                    ? documentos.map((d) => `• ${d.fileName}`).join("<br/>")
                    : "Nenhum documento anexado"
                }
              </div>
            </div>
          </div>

          <!-- HISTÓRICO DE ENTREVISTAS -->
          ${
            func.interviews.length > 0
              ? `
            <div class="section-title">07 • HISTÓRICO DE ENTREVISTAS E AVALIAÇÃO DE RH</div>
            ${func.interviews
              .map(
                (int) => `
              <div class="field col-12" style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                  <strong style="font-size: 12px; color: #0f172a;">Entrevistador: ${int.interviewer}</strong>
                  <span style="font-size: 11px; color: #64748b;">${new Date(int.interviewDate).toLocaleString("pt-BR")} — Status: <strong>${int.status}</strong></span>
                </div>
                <div class="field-label">Pontos Chave / Avaliação:</div>
                <div class="field-value" style="font-weight: normal; margin-bottom: 6px;">${int.points}</div>
                <div class="field-label">Relatório da Conversa:</div>
                <div class="field-value" style="font-weight: normal; white-space: pre-wrap;">${int.summary}</div>
              </div>
            `
              )
              .join("")}
          `
              : ""
          }

          <!-- TERMO E ASSINATURAS -->
          <div class="signatures">
            <div class="sig-line">
              ${
                func.signatureUrl
                  ? `<img src="${func.signatureUrl}" alt="Assinatura" style="max-height: 45px; display: block; margin: 0 auto 4px auto;" />`
                  : ""
              }
              <strong>${employeeName}</strong><br>
              Assinatura do Colaborador
            </div>
            <div class="sig-line">
              <br><br>
              <strong>Elite Soluções / Recursos Humanos</strong><br>
              Assinatura do Empregador / Gestor
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Erro ao gerar ficha do funcionário:", err);
    return new NextResponse("Erro interno ao gerar a ficha do funcionário.", {
      status: 500,
    });
  }
}
