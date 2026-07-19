import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Criando usuário administrador na nuvem...");

  const adminEmail = "admin"; // ou o email que você usa para login master
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador Master",
        password: hashedPassword,
        role: "ADMIN",
        // Habilita todos os módulos
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
    console.log("Usuário admin criado com sucesso!");
    console.log("Login: admin | Senha: admin123");
  } else {
    console.log("O usuário admin já existe no banco de dados.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
