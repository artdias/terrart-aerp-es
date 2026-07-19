import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Username / Email", type: "text" },
        password: { label: "Senha", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Auto-criar o admin master se ele não existir e as credenciais forem admin/admin
        if (!user && credentials.email === "admin" && credentials.password === "admin") {
          const hashedPassword = await bcrypt.hash("admin", 10);
          user = await prisma.user.create({
            data: {
              email: "admin",
              name: "Administrador Geral",
              password: hashedPassword,
              role: "ADMIN",
              allowClientes: true,
              allowFuncionarios: true,
              allowEscalas: true,
              allowEstoque: true,
              allowCautelas: true,
              allowFinanceiro: true,
              allowJuridico: true,
              allowFaturamento: true,
              allowRecepcao: true,
              allowRelatorios: true
            }
          });
        }

        if (!user) return null;

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          allowClientes: user.allowClientes,
          allowFuncionarios: user.allowFuncionarios,
          allowEscalas: user.allowEscalas,
          allowEstoque: user.allowEstoque,
          allowCautelas: user.allowCautelas,
          allowFinanceiro: user.allowFinanceiro,
          allowJuridico: user.allowJuridico,
          allowFaturamento: user.allowFaturamento,
          allowRecepcao: user.allowRecepcao,
          allowRelatorios: user.allowRelatorios
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.allowClientes = (user as any).allowClientes;
        token.allowFuncionarios = (user as any).allowFuncionarios;
        token.allowEscalas = (user as any).allowEscalas;
        token.allowEstoque = (user as any).allowEstoque;
        token.allowCautelas = (user as any).allowCautelas;
        token.allowFinanceiro = (user as any).allowFinanceiro;
        token.allowJuridico = (user as any).allowJuridico;
        token.allowFaturamento = (user as any).allowFaturamento;
        token.allowRecepcao = (user as any).allowRecepcao;
        token.allowRelatorios = (user as any).allowRelatorios;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
        (session.user as any).permissions = {
          allowClientes: token.allowClientes,
          allowFuncionarios: token.allowFuncionarios,
          allowEscalas: token.allowEscalas,
          allowEstoque: token.allowEstoque,
          allowCautelas: token.allowCautelas,
          allowFinanceiro: token.allowFinanceiro,
          allowJuridico: token.allowJuridico,
          allowFaturamento: token.allowFaturamento,
          allowRecepcao: token.allowRecepcao,
          allowRelatorios: token.allowRelatorios
        };
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-aerp-key"
};
