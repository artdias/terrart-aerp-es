import styles from "../clientes/clientes.module.css";
import { Plus, Package, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import CautelasGroupedTable from "./CautelasGroupedTable";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CautelasPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; sortBy?: string; order?: string; tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowCautelas) {
    redirect("/");
  }

  const tab = searchParams?.tab || "ativas";
  const search = searchParams?.search || "";
  const status = searchParams?.status || "";
  const sortBy = searchParams?.sortBy || "borrowedAt";
  const order = searchParams?.order || "desc";

  const andConditions: any[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { observations: { contains: search } },
        { product: { name: { contains: search } } },
        { employee: { 
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { user: { name: { contains: search } } }
          ] 
        } }
      ]
    });
  }

  // Filtragem de acordo com o status selecionado ou aba ativa
  if (status) {
    andConditions.push({ status });
  } else {
    if (tab === "ativas") {
      andConditions.push({ status: "EM USO" });
    } else {
      andConditions.push({ status: { not: "EM USO" } });
    }
  }

  const cautelas = await prisma.employeeEquipment.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : {},
    orderBy: {
      [sortBy]: order
    },
    include: { 
      employee: { include: { user: true } }, 
      product: true,
      document: true
    }
  });

  // Agrupar Cautelas por Funcionário
  const grouped = cautelas.reduce((acc, cautela) => {
    if (!acc[cautela.employeeId]) {
      acc[cautela.employeeId] = {
        employee: cautela.employee,
        equipments: []
      };
    }
    acc[cautela.employeeId].equipments.push(cautela);
    return acc;
  }, {} as Record<string, any>);

  const groupedArray = Object.values(grouped);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Atribuição de Materiais</h1>
          <p className={styles.subtitle}>Gerencie uniformes, EPIs, ferramentas e consumíveis entregues aos funcionários.</p>
        </div>
        <Link href="/cautelas/novo" className={styles.addButton}>
          <Plus size={20} />
          <span>Registrar Retirada</span>
        </Link>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        <Link 
          href={`/cautelas?tab=ativas&search=${search}&sortBy=${sortBy}&order=${order}`}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: tab === "ativas" ? '#003366' : 'white',
            color: tab === "ativas" ? 'white' : '#555',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          Entregas Ativas (Em Uso)
        </Link>
        <Link 
          href={`/cautelas?tab=historico&search=${search}&sortBy=${sortBy}&order=${order}`}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: tab === "historico" ? '#003366' : 'white',
            color: tab === "historico" ? 'white' : '#555',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          Histórico de Baixas
        </Link>
      </div>

      {/* Barra de Filtros Reativa */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        border: '1px solid #eee'
      }}>
        <SearchInput placeholder="Pesquise por func, material, obs..." />
        
        <FilterSelect 
          name="status"
          defaultValue={status}
          options={
            tab === "ativas" 
              ? [
                  { value: "", label: "Todos Status (Ativas)" },
                  { value: "EM USO", label: "Em Uso" }
                ]
              : [
                  { value: "", label: "Todos Status (Baixados)" },
                  { value: "DEVOLVIDO", label: "Devolvido ao Estoque" },
                  { value: "CONSUMIDO", label: "Consumido / Gasto" },
                  { value: "DANIFICADO", label: "Danificado / Manutenção" },
                  { value: "PERDIDO", label: "Perdido / Extraviado" }
                ]
          }
        />

        <FilterSelect 
          name="sortBy"
          defaultValue={sortBy}
          options={[
            { value: "borrowedAt", label: "Ordenar por Data de Entrega" },
            { value: "quantity", label: "Ordenar por Quantidade" }
          ]}
        />

        <FilterSelect 
          name="order"
          defaultValue={order}
          options={[
            { value: "asc", label: "Ordem Crescente" },
            { value: "desc", label: "Ordem Decrescente" }
          ]}
        />

        {search || status || sortBy !== "borrowedAt" || order !== "desc" ? (
          <Link href={`/cautelas?tab=${tab}`} style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 600, textDecoration: 'none' }}>
            Limpar Filtros
          </Link>
        ) : null}
      </div>

      <CautelasGroupedTable groups={groupedArray} tab={tab} />
    </div>
  );
}
