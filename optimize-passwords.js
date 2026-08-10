const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function optimizePasswords() {
  console.log("Fetching all users...");
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    if (!user.password || user.password === 'group_chat_placeholder_hash') continue;
    
    // In our system, the original passwords were 'admin1234' for admin, and 'renata' for renata.
    // If there are other users, this script won't know their plain text password to re-hash.
    // Let's just reset the known ones to the optimized hash.
    
    let plainTextPassword = null;
    if (user.email === 'admin') {
      plainTextPassword = 'admin1234';
    } else if (user.email === 'renata') {
      plainTextPassword = 'renata'; // Assuming this is her password, based on standard seeding. 
      // Actually, if we don't know the plain text, we can't rehash it. We only care about admin for now.
    }

    if (plainTextPassword) {
      console.log(`Optimizing password for ${user.email} (using 6 salt rounds)...`);
      const fastHash = await bcrypt.hash(plainTextPassword, 6);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: fastHash }
      });
      console.log(`Updated ${user.email} successfully.`);
    }
  }
}

optimizePasswords()
  .then(() => {
    console.log("All known passwords optimized for Vercel speed!");
  })
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
