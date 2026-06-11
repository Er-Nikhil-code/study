import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'TEACHER' } });
  for (const user of users) {
    const questions = await prisma.question.count({ where: { created_by: user.id } });
    console.log(`Teacher: ${user.email} (ID: ${user.id}) - Questions Created: ${questions}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
