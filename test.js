const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { cpf: '409.000.000-05' },
    include: { attachments: true }
  });
  console.log(emp ? (emp.attachments.length ? emp.attachments.map(a => a.fileName) : 'No attachments') : 'No employee');
}

main().finally(() => prisma.$disconnect());
