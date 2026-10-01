import { NextResponse } from "next/server";
import { generateNextBadgeCode } from "@/lib/badgeCode";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    
    const code = await generateNextBadgeCode(department);
    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error("Erro ao gerar código de crachá:", error);
    return NextResponse.json({ success: false, error: "Falha ao gerar código" }, { status: 500 });
  }
}
