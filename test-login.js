const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres:oWrGWJcFW9kMOx1I@db.ncqyamrmzfgnqomyrtqj.supabase.co:5432/postgres"
});

async function testLogin() {
  const email = "admin";
  const password = "admin1234";

  console.log(`Buscando usuario ${email}...`);
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log("Usuario nao encontrado!");
    return;
  }

  console.log("Usuario encontrado! Verificando senha...");
  const isValid = await bcrypt.compare(password, user.password);
  
  if (isValid) {
    console.log("LOGIN COM SUCESSO!");
  } else {
    console.log("SENHA INCORRETA!");
  }
}

testLogin()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
