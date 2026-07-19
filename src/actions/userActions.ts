"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }

  const name = sanitizeInput(formData.get("name") as string);
  const email = sanitizeInput(formData.get("email") as string);
  const password = formData.get("password") as string;
  const role = "USER";

  if (!name || !email || !password) {
    throw new Error("Nome, Usuário (Login) e Senha são obrigatórios.");
  }

  // Verificar se o login/e-mail já existe
  const existing = await prisma.user.findUnique({
    where: { email }
  });
  if (existing) {
    throw new Error("Este nome de usuário / e-mail já está cadastrado.");
  }

  // Hashing da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Mapear checkboxes booleanas
  const allowClientes = formData.get("allowClientes") === "on";
  const allowFuncionarios = formData.get("allowFuncionarios") === "on";
  const allowEscalas = formData.get("allowEscalas") === "on";
  const allowEstoque = formData.get("allowEstoque") === "on";
  const allowCautelas = formData.get("allowCautelas") === "on";
  const allowFinanceiro = formData.get("allowFinanceiro") === "on";
  const allowJuridico = formData.get("allowJuridico") === "on";
  const allowFaturamento = formData.get("allowFaturamento") === "on";
  const allowRecepcao = formData.get("allowRecepcao") === "on";
  const allowRelatorios = formData.get("allowRelatorios") === "on";

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      allowClientes,
      allowFuncionarios,
      allowEscalas,
      allowEstoque,
      allowCautelas,
      allowFinanceiro,
      allowJuridico,
      allowFaturamento,
      allowRecepcao,
      allowRelatorios
    }
  });

  await logAction("CREATE_USER", `Criou o usuário ${email} (${name}) com perfil ${role}.`);

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function deleteUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }

  const userId = sanitizeInput(formData.get("userId") as string);
  if (!userId) {
    throw new Error("ID de usuário inválido.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  // Impedir a exclusão do admin master padrão
  if (user.email === "admin") {
    throw new Error("Não é possível remover o administrador master padrão.");
  }

  // Impedir que o admin logado exclua a si mesmo
  if (user.id === (session.user as any).id) {
    throw new Error("Você não pode excluir a si mesmo.");
  }

  await logAction("DELETE_USER", `Excluiu o usuário ${user.email} (ID: ${userId}, Nome: ${user.name}).`);

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/usuarios");
}

export async function updateUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }

  const userId = sanitizeInput(formData.get("userId") as string);
  const name = sanitizeInput(formData.get("name") as string);
  const email = sanitizeInput(formData.get("email") as string);
  const password = formData.get("password") as string;

  if (!userId || !name || !email) {
    throw new Error("ID, Nome e Usuário (Login) são obrigatórios.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    throw new Error("Usuário não encontrado.");
  }

  // Se o email mudou, verificar se o novo login já está em uso
  if (existingUser.email !== email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email }
    });
    if (emailConflict) {
      throw new Error("Este nome de usuário / login já está em uso.");
    }
  }

  const dataToUpdate: any = {
    name,
    email,
    allowClientes: formData.get("allowClientes") === "on",
    allowFuncionarios: formData.get("allowFuncionarios") === "on",
    allowEscalas: formData.get("allowEscalas") === "on",
    allowEstoque: formData.get("allowEstoque") === "on",
    allowCautelas: formData.get("allowCautelas") === "on",
    allowFinanceiro: formData.get("allowFinanceiro") === "on",
    allowJuridico: formData.get("allowJuridico") === "on",
    allowFaturamento: formData.get("allowFaturamento") === "on",
    allowRecepcao: formData.get("allowRecepcao") === "on",
    allowRelatorios: formData.get("allowRelatorios") === "on"
  };

  if (password && password.trim() !== "") {
    dataToUpdate.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  });

  await logAction("UPDATE_USER", `Atualizou os dados do usuário ${email} (${name}).`);

  revalidatePath("/usuarios");
  redirect("/usuarios");
}
