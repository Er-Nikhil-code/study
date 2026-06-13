const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const tests = await prisma.test.findMany();
  console.log('Total tests:', tests.length);
  console.log(tests.map(t => t.id + ' | ' + t.title + ' | ' + t.created_by));
}
run().catch(console.error).finally(() => prisma.$disconnect());
