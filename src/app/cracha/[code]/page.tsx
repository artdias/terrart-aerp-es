import { redirect } from "next/navigation";

export default function CrachaAliasPage({ params }: { params: { code: string } }) {
  redirect(`/validar/${encodeURIComponent(params.code)}`);
}
