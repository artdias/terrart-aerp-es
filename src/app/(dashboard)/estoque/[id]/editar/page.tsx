import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditProdutoForm from "./EditProdutoForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditarProdutoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowProducts) {
    redirect("/");
  }

  const produto = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!produto || produto.deleted) {
    return notFound();
  }

  return <EditProdutoForm produto={produto} />;
}
