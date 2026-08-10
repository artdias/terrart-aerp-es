import { prisma } from "@/lib/prisma";
import NovaDespesaForm from "./NovaDespesaForm";

export default async function NovaDespesaPage() {
  try {
    // Busca todos os produtos do estoque central para exibição na integração
    const produtos = await prisma.product.findMany({ where: { deleted: false }, 
      orderBy: { name: 'asc' },
      select: { id: true, name: true, unit: true, category: true }
    });

    return <NovaDespesaForm produtos={produtos} />;
  } catch (error: any) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <h2>Erro ao carregar a página:</h2>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}
