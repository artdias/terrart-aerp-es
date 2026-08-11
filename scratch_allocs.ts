import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const allocs = await prisma.jobAllocation.findMany({
    include: { employee: true }
  });
  
  console.log("=== JOB ALLOCATIONS ===");
  allocs.forEach(a => {
    console.log(`Employee: ${a.employee.firstName}, Task: ${a.task}, Status: '${a.status}'`);
  });
  console.log("=======================");
}

main().finally(() => prisma.$disconnect());
