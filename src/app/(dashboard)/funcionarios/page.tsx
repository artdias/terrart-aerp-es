import styles from "../clientes/clientes.module.css";
import { Plus, Users, Briefcase, Printer, FileSpreadsheet, Phone } from "lucide-react";
import Link from "next/link";
import CopyLinkButton from "@/components/CopyLinkButton";
import PrintFichaVaziaButton from "@/components/PrintFichaVaziaButton";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import SortableHeader from "@/components/SortableHeader";
import FilterSelect from "@/components/FilterSelect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteEmployee } from "@/actions/employeeActions";
import DeleteButton from "@/components/DeleteButton";
import WhatsAppButton from "@/components/WhatsAppButton";

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
    order?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if (
    (session.user as any).role !== "ADMIN" &&
    !(session.user as any).permissions?.allowFuncionarios
  ) {
    redirect("/");
  }

  const search = searchParams?.search || "";
  const status = searchParams?.status || "";
  const roleFilter = searchParams?.role || "";
  const sortBy = searchParams?.sortBy || "createdAt";
  const order = searchParams?.order || "desc";

  // Buscar categorias / cargos cadastrados e distintos
  const [jobRoles, distinctEmpRoles] = await Promise.all([
    prisma.jobRole.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.employee.findMany({
      where: { deleted: false },
      select: { roleTitle: true },
      distinct: ["roleTitle"],
    }),
  ]);

  const roleSet = new Set<string>();
  jobRoles.forEach((r) => {
    if (r.name?.trim()) roleSet.add(r.name.trim());
  });
  distinctEmpRoles.forEach((e) => {
    if (e.roleTitle?.trim()) roleSet.add(e.roleTitle.trim());
  });
  const availableRoles = Array.from(roleSet).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const andConditions: any[] = [{ deleted: false }];

  if (search) {
    andConditions.push({
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { roleTitle: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (roleFilter) {
    andConditions.push({
      roleTitle: { contains: roleFilter, mode: "insensitive" },
    });
  }

  const funcionarios = await prisma.employee.findMany({
    where: { deleted: false, AND: andConditions },
    orderBy: {
      [sortBy]: order,
    },
    include: {
      user: true,
      workplace: { include: { client: true } },
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Funcionários</h1>
          <p className={styles.subtitle}>
            Gerencie o cadastro de terceirizados, categorias (ex: ASG), telefones e alocações.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href={`/relatorios?tab=funcionarios&role=${encodeURIComponent(
              roleFilter
            )}&status=${encodeURIComponent(status)}&fields=contatos`}
            className={styles.actionBtn}
            style={{
              background: "#0284c7",
              color: "white",
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FileSpreadsheet size={18} />
            <span>Extrair Relatório (Nome/Tel)</span>
          </Link>
          <PrintFichaVaziaButton className={styles.actionBtn} />
          <CopyLinkButton
            url="/cadastro-candidato"
            label="Copiar Link Candidato"
            style={{
              background: "#9b59b6",
              color: "white",
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          />
          <Link
            href="/funcionarios/cargos"
            className={styles.actionBtn}
            style={{
              background: "#f39c12",
              color: "white",
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Briefcase size={20} />
            <span>Gerenciar Cargos</span>
          </Link>
          <Link href="/funcionarios/novo" className={styles.addButton}>
            <Plus size={20} />
            <span>Novo Funcionário</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros Reativa */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          background: "white",
          padding: "1rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          border: "1px solid #eee",
        }}
      >
        <SearchInput placeholder="Pesquise por nome, telefone, CPF ou cargo..." />

        <FilterSelect
          name="role"
          defaultValue={roleFilter}
          options={[
            { value: "", label: "Todas as Categorias / Cargos" },
            ...availableRoles.map((r) => ({ value: r, label: r })),
          ]}
        />

        <FilterSelect
          name="status"
          defaultValue={status}
          options={[
            { value: "", label: "Todos os Status" },
            { value: "Ativo", label: "Ativo" },
            { value: "Inativo", label: "Inativo" },
            { value: "Ausente", label: "Ausente" },
            { value: "Entrevista", label: "Entrevista" },
          ]}
        />

        {search || status || roleFilter || sortBy !== "createdAt" || order !== "desc" ? (
          <Link
            href="/funcionarios"
            style={{
              fontSize: "0.85rem",
              color: "#c0392b",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Limpar Filtros
          </Link>
        ) : null}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <SortableHeader label="Nome / CPF" value="firstName" />
              </th>
              <th>
                <SortableHeader label="Categoria / Cargo" value="roleTitle" />
              </th>
              <th>Telefone / WhatsApp</th>
              <th>
                <SortableHeader label="Status" value="status" />
              </th>
              <th>
                <SortableHeader label="Data de Cadastro" value="createdAt" />
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Nenhum funcionário correspondente encontrado.
                </td>
              </tr>
            ) : (
              funcionarios.map((func) => {
                const fullName =
                  func.user?.name ||
                  `${func.firstName || ""} ${func.lastName || ""}`.trim() ||
                  "Sem Nome";

                return (
                  <tr key={func.id}>
                    <td>
                      <div className={styles.cellWithIcon} style={{ gap: "12px" }}>
                        {func.photoUrl ? (
                          <img
                            src={func.photoUrl}
                            alt=""
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid #eee",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94a3b8",
                            }}
                          >
                            <Users size={18} />
                          </div>
                        )}
                        <div>
                          <div className={styles.strongText}>{fullName}</div>
                          <div style={{ fontSize: "0.8rem", color: "#666" }}>CPF: {func.cpf}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellWithIcon}>
                        <Briefcase size={16} className={styles.icon} />
                        {func.roleTitle}
                      </div>
                    </td>
                    <td>
                      {func.phone ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.86rem",
                              fontWeight: 600,
                              color: "#1e293b",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Phone size={13} color="#64748b" />
                            {func.phone}
                          </span>
                          <WhatsAppButton phone={func.phone} name={fullName} size="sm" />
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          Não cadastrado
                        </span>
                      )}
                    </td>
                    <td>
                      {func.status === "Ativo" ? (
                        <span
                          style={{
                            color: "#27ae60",
                            fontWeight: 600,
                            background: "#eafaf1",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                          }}
                        >
                          Ativo
                        </span>
                      ) : func.status === "Inativo" ? (
                        <span
                          style={{
                            color: "#e74c3c",
                            fontWeight: 600,
                            background: "#fdedec",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                          }}
                        >
                          Inativo
                        </span>
                      ) : func.status === "Ausente" ? (
                        <span
                          style={{
                            color: "#f39c12",
                            fontWeight: 600,
                            background: "#fef5e7",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                          }}
                        >
                          Ausente
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#2980b9",
                            fontWeight: 600,
                            background: "#ebf5fb",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                          }}
                        >
                          {func.status || "Entrevista"}
                        </span>
                      )}
                    </td>
                    <td>{func.createdAt.toLocaleDateString("pt-BR")}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <Link
                          href={`/funcionarios/${func.id}`}
                          className={styles.actionBtn}
                          style={{
                            background: "#3498db",
                            color: "white",
                            textDecoration: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                          }}
                        >
                          Visualizar
                        </Link>
                        <Link
                          href={`/api/funcionarios/${func.id}/ficha`}
                          target="_blank"
                          className={styles.actionBtn}
                          style={{
                            background: "#003366",
                            color: "white",
                            textDecoration: "none",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Exportar Ficha em PDF"
                        >
                          <Printer size={14} /> Ficha
                        </Link>
                        <Link
                          href={`/funcionarios/${func.id}/editar`}
                          className={styles.actionBtn}
                          style={{
                            background: "#f39c12",
                            color: "white",
                            textDecoration: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                          }}
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          action={deleteEmployee}
                          id={func.id}
                          name="employeeId"
                          confirmText="Deseja mover este funcionário para a lixeira?"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
