const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin1234', 10);
  const updatedUser = await prisma.user.update({
    where: { email: 'admin' },
    data: { password: hash }
  });
  console.log('User admin password updated to admin1234 successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
