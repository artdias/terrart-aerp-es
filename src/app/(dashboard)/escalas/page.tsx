import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestão de Escalas | AERP",
};

export default function EscalasHubPage() {
  redirect("/escalas/planejamento");
}