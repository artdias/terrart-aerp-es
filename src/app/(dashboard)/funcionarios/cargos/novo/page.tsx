import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NovoCargoForm from "./NovoCargoForm";

export default async function NovoCargoPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  
  if ((session.user as any).role !== "ADMIN" && !(session.user as any).permissions?.allowFuncionarios) {
    redirect("/");
  }

  return <NovoCargoForm />;
}
