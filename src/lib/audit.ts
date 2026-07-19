import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Registra uma ação do usuário ou do sistema na tabela de logs de auditoria (AuditLog).
 * É executado de forma assíncrona e isolada para não travar a execução principal.
 * 
 * @param action O identificador da ação executada (ex: "CREATE_CLIENT", "DELETE_PRODUCT")
 * @param details O texto livre ou JSON com os detalhes da alteração/movimentação
 */
export async function logAction(action: string, details: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;
    const userName = (session?.user as any)?.name || "Sistema";

    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        details
      }
    });
  } catch (err) {
    console.error("Falha ao registrar log de auditoria:", err);
  }
}
