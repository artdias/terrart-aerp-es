import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

async function handler(req: NextRequest, ctx: any) {
  // Use Vercel's URL instead of localhost if in production
  if (process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.includes("localhost")) {
    process.env.NEXTAUTH_URL = `https://${req.headers.get("host") || process.env.VERCEL_URL}`;
  }

  const dynamicOptions = { ...authOptions };

  try {
    if (req.method === "POST") {
      const cloned = req.clone();
      const bodyText = await cloned.text();
      const params = new URLSearchParams(bodyText);
      const rememberMe = params.get("rememberMe") === "true";

      if (!rememberMe) {
        dynamicOptions.cookies = {
          sessionToken: {
            name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: process.env.NODE_ENV === "production",
            }
          }
        };
      }
    }
  } catch (err) {
    // Ignore error
  }

  return NextAuth(req, ctx, dynamicOptions);
}

export { handler as GET, handler as POST };
