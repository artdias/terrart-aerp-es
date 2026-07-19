import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

async function handler(req: NextRequest, ctx: any) {
  // Clonar o objeto de configurações estáticas para evitar concorrência de memória
  const dynamicOptions = { ...authOptions };

  try {
    if (req.method === "POST") {
      const cloned = req.clone();
      const bodyText = await cloned.text();
      const params = new URLSearchParams(bodyText);
      const rememberMe = params.get("rememberMe") === "true";

      // Se "Mantenha-me conectado" NÃO for selecionado, removemos o maxAge do cookie
      // transformando-o em um cookie de sessão (apagado ao fechar o navegador)
      if (!rememberMe) {
        dynamicOptions.cookies = {
          sessionToken: {
            name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: process.env.NODE_ENV === "production",
              // Deixar maxAge indefinido/omitido torna o cookie temporário (expira ao fechar navegador)
            }
          }
        };
      }
    }
  } catch (err) {
    // ignore
  }

  return NextAuth(req, ctx, dynamicOptions);
}

export { handler as GET, handler as POST };
