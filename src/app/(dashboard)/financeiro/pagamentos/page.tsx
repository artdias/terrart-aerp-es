import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PagamentosFuncionariosClient, { EmployeePaymentRow } from "./PagamentosFuncionariosClient";

export const metadata = {
  title: "Pagamentos de Funcionários | AERP"
};

export default async function PagamentosFuncionariosPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const p = (session.user as any).permissions || {};
  if (!isAdmin && !p.allowFinanceiro) {
    redirect("/");
  }

  const employees = await prisma.employee.findMany({
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
  });

  const serializedEmployees: EmployeePaymentRow[] = employees.map((emp) => {
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

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <Link
          href="/financeiro"
          style={{
            color: "#6b7280",
            textDecoration: "none",
            display: "flex",
            alignItems: "center"
          }}
          title="Voltar para Financeiro"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a" }}>
            Financeiro — Pagamentos
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
            Gestão de comprovantes de pagamento e notas assinadas dos funcionários.
          </p>
        </div>
      </header>

      <PagamentosFuncionariosClient initialEmployees={serializedEmployees} />
    </div>
  );
}
