import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { first_name: "Khushi" } });
  console.log("Users named Khushi:", users.map(u => ({ id: u.id, email: u.email, role: u.role, first_name: u.first_name })));
  
  if (users.length > 0) {
    const userId = users[0].id;
    const questionsCreated = await prisma.question.count({ where: { created_by: userId } });
    const testsCreated = await prisma.test.count({ where: { created_by: userId } });
    console.log("Questions created:", questionsCreated);
    console.log("Tests created:", testsCreated);
    
    // Check if she approved anything
    const questionsApproved = await prisma.question.count({ where: { approved_by: userId } });
    console.log("Questions approved:", questionsApproved);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
