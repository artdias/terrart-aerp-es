import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: { deleted: false },
      select: {
        id: true,
        companyName: true,
        name: true,
        logoUrl: true
      },
      orderBy: { companyName: "asc" }
    });

    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json({ success: false, clients: [] }, { status: 500 });
  }
}
