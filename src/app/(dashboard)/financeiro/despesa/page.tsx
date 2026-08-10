import { prisma } from "@/lib/prisma";
import NovaDespesaForm from "./NovaDespesaForm";

export default async function NovaDespesaPage() {
  try {
    // Busca todos os produtos do estoque central para exibição na integração
    const produtosDb = await prisma.product.findMany({ where: { deleted: false }, 
      orderBy: { name: 'asc' },
      select: { id: true, name: true, unit: true, category: true }
    });

    // Converter para objetos simples do JS para evitar erros de serialização do Next.js no Vercel
    const produtos = produtosDb.map(p => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      category: p.category
    }));

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
