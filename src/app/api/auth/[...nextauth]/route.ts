import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

// Fix Vercel issue where NEXTAUTH_URL might be incorrectly set to localhost
if (process.env.NODE_ENV === "production") {
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes("localhost")) {
    delete process.env.NEXTAUTH_URL; // Allows NextAuth to use VERCEL_URL auto-detection
  }
}

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
      if (!rememberMe) {
        dynamicOptions.cookies = {
          sessionToken: {
            name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: process.env.NODE_ENV === "production",
              // Deixar maxAge indefinido/omitido torna o cookie temporário
            }
          }
        };
      }
    }
  } catch (err) {
    console.error("Error processing rememberMe:", err);
  }

  return NextAuth(req, ctx, dynamicOptions);
}

export { handler as GET, handler as POST };
