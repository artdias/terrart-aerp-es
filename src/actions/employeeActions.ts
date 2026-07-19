"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeInput } from "@/lib/sanitize";
import fs from "fs/promises";
import path from "path";
import { logAction } from "@/lib/audit";

export async function createEmployee(formData: FormData) {
  // Higienizar todos os inputs textuais
  const firstName = sanitizeInput(formData.get("firstName") as string);
  const lastName = sanitizeInput(formData.get("lastName") as string);
  const email = sanitizeInput(formData.get("email") as string);
  const cpf = sanitizeInput(formData.get("cpf") as string);
  const roleTitle = sanitizeInput(formData.get("roleTitle") as string);
  const clientId = sanitizeInput(formData.get("clientId") as string);

  const cnh = sanitizeInput(formData.get("cnh") as string);
  const cnhExpiration = sanitizeInput(formData.get("cnhExpiration") as string);
  const rg = sanitizeInput(formData.get("rg") as string);
  const birthDate = sanitizeInput(formData.get("birthDate") as string);
  const educationLevel = sanitizeInput(formData.get("educationLevel") as string);
  const gender = sanitizeInput(formData.get("gender") as string);
  const status = sanitizeInput(formData.get("status") as string);

  if (!firstName || !email || !cpf || !roleTitle) {
    throw new Error("Preencha todos os campos obrigatórios");
  }

  // Prevenir colisão de E-mail
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  if (existingUser) {
    throw new Error("Já existe um usuário cadastrado com este e-mail.");
  }

  // Prevenir colisão de CPF
  const existingEmployee = await prisma.employee.findUnique({
    where: { cpf }
  });
  if (existingEmployee) {
    if (existingEmployee.deleted) {
      throw new Error("Já existe um funcionário com este CPF na Lixeira. Por favor, restaure-o ou informe outro CPF.");
    } else {
      throw new Error("Já existe um funcionário cadastrado com este CPF.");
    }
  }

  // 1. Criar usuário no sistema (nome completo = firstName + lastName)
  const fullName = `${firstName} ${lastName || ''}`.trim();
  const user = await prisma.user.create({
    data: {
      name: fullName,
      email,
      password: "123", // Senha padrão temporária
      role: "EMPLOYEE",
    }
  });

  // 2. Verificar/Criar posto de trabalho para alocação
  let workplaceId: string | undefined = undefined;
  if (clientId && clientId !== "") {
    let workplace = await prisma.workplace.findFirst({
      where: { clientId }
    });
    
    if (!workplace) {
      workplace = await prisma.workplace.create({
        data: { name: "Posto Padrão", clientId, address: "Mesmo do cliente" }
      });
    }
    workplaceId = workplace.id;
  }

  // 3. Criar perfil de Funcionário
  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      cpf,
      cnh,
      cnhExpiration,
      rg,
      birthDate,
      educationLevel,
      gender,
      status: status || "Ativo",
      roleTitle,
      workplaceId
    }
  });

  // 4. Processar e salvar os múltiplos arquivos de anexos fisicamente e no banco de dados
  const certificates = formData.getAll("certificates") as File[];
  const documents = formData.getAll("documents") as File[];

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  // Salvar Certificados
  for (const file of certificates) {
    if (file && file.size > 0 && file.name) {
      const sanitizedFileName = sanitizeInput(file.name);
      const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadsDir, filename);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      await prisma.attachment.create({
        data: {
          employeeId: employee.id,
          fileName: sanitizedFileName,
          fileUrl: `/uploads/${filename}`,
          type: "CERTIFICATE"
        }
      });
    }
  }

  // Salvar Documentos Pessoais
  for (const file of documents) {
    if (file && file.size > 0 && file.name) {
      const sanitizedFileName = sanitizeInput(file.name);
      const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadsDir, filename);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      await prisma.attachment.create({
        data: {
          employeeId: employee.id,
          fileName: sanitizedFileName,
          fileUrl: `/uploads/${filename}`,
          type: "DOCUMENT"
        }
      });
    }
  }

  revalidatePath("/funcionarios");
  redirect("/funcionarios");
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  // Higienizar todos os inputs textuais
  const firstName = sanitizeInput(formData.get("firstName") as string);
  const lastName = sanitizeInput(formData.get("lastName") as string);
  const email = sanitizeInput(formData.get("email") as string);
  const cpf = sanitizeInput(formData.get("cpf") as string);
  const roleTitle = sanitizeInput(formData.get("roleTitle") as string);
  const clientId = sanitizeInput(formData.get("clientId") as string);

  const cnh = sanitizeInput(formData.get("cnh") as string);
  const cnhExpiration = sanitizeInput(formData.get("cnhExpiration") as string);
  const rg = sanitizeInput(formData.get("rg") as string);
  const birthDate = sanitizeInput(formData.get("birthDate") as string);
  const educationLevel = sanitizeInput(formData.get("educationLevel") as string);
  const gender = sanitizeInput(formData.get("gender") as string);
  const status = sanitizeInput(formData.get("status") as string);

  if (!firstName || !email || !cpf || !roleTitle) {
    throw new Error("Preencha todos os campos obrigatórios");
  }

  // 1. Obter perfil do funcionário
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true }
  });

  if (!employee) throw new Error("Funcionário não encontrado");

  // Prevenir colisão de E-mail
  if (employee.userId) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: employee.userId }
      }
    });
    if (existingUser) {
      throw new Error("Este e-mail já está em uso por outro usuário.");
    }
  }

  // Prevenir colisão de CPF
  const existingEmployee = await prisma.employee.findFirst({
    where: {
      cpf,
      NOT: { id: employeeId }
    }
  });
  if (existingEmployee) {
    throw new Error("Este CPF já está em uso por outro funcionário.");
  }

  // 2. Atualizar usuário associado
  const fullName = `${firstName} ${lastName || ''}`.trim();
  if (employee.userId) {
    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        name: fullName,
        email,
      }
    });
  }

  // 3. Verificar/Atualizar posto de trabalho para alocação
  let workplaceId: string | null = null;
  if (clientId && clientId !== "") {
    let workplace = await prisma.workplace.findFirst({
      where: { clientId }
    });
    
    if (!workplace) {
      workplace = await prisma.workplace.create({
        data: { name: "Posto Padrão", clientId, address: "Mesmo do cliente" }
      });
    }
    workplaceId = workplace.id;
  }

  // 4. Atualizar perfil de Funcionário
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      firstName,
      lastName,
      cpf,
      cnh,
      cnhExpiration,
      rg,
      birthDate,
      educationLevel,
      gender,
      status: status || "Ativo",
      roleTitle,
      workplaceId
    }
  });

  // 5. Processar novos arquivos se enviados
  const certificates = formData.getAll("certificates") as File[];
  const documents = formData.getAll("documents") as File[];

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  // Salvar novos Certificados
  for (const file of certificates) {
    if (file && file.size > 0 && file.name) {
      const sanitizedFileName = sanitizeInput(file.name);
      const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadsDir, filename);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      await prisma.attachment.create({
        data: {
          employeeId,
          fileName: sanitizedFileName,
          fileUrl: `/uploads/${filename}`,
          type: "CERTIFICATE"
        }
      });
    }
  }

  // Salvar novos Documentos Pessoais
  for (const file of documents) {
    if (file && file.size > 0 && file.name) {
      const sanitizedFileName = sanitizeInput(file.name);
      const filename = `${Date.now()}-${sanitizedFileName.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadsDir, filename);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      await prisma.attachment.create({
        data: {
          employeeId,
          fileName: sanitizedFileName,
          fileUrl: `/uploads/${filename}`,
          type: "DOCUMENT"
        }
      });
    }
  }

  revalidatePath("/funcionarios");
  revalidatePath(`/funcionarios/${employeeId}`);
  redirect("/funcionarios");
}

export async function deleteEmployee(formData: FormData) {
  const id = sanitizeInput(formData.get("employeeId") as string);
  if (!id) {
    throw new Error("ID de funcionário inválido.");
  }

  // TRAVA DE SEGURANÇA: Verificar se o funcionário possui vínculos ativos
  const relations = await prisma.employee.findUnique({
    where: { id },
    include: {
      jobAllocations: { where: { status: { not: "Cancelada" } } },
      equipments: { where: { status: "Em Uso" } },
    }
  });

  if (relations) {
    if (relations.jobAllocations.length > 0) {
      throw new Error("Não é possível excluir este funcionário pois ele possui escalas/alocações vinculadas a ele. Você deve cancelá-las ou excluí-las primeiro.");
    }
    if (relations.equipments.length > 0) {
      throw new Error("Não é possível excluir este funcionário pois ele possui equipamentos/cautelas em uso. Faça a devolução primeiro.");
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { deleted: true }
  });

  const fullName = `${employee.firstName} ${employee.lastName || ""}`.trim();
  await logAction("DELETE_EMPLOYEE", `Moveu o funcionário '${fullName}' (ID: ${id}) para a lixeira.`);

  revalidatePath("/funcionarios");
  revalidatePath("/lixeira");
}
