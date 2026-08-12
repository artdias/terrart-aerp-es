import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const attachments = await prisma.attachment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(attachments.length ? attachments.map(a => `${a.employeeId} - ${a.fileName} - ${a.fileUrl.substring(0, 30)}...`) : 'No attachments');
}

main().finally(() => prisma.$disconnect());
