require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tests = await prisma.test.findMany({ take: 1 });
  if (tests.length > 0) {
    try {
      await prisma.test.delete({ where: { id: tests[0].id } });
      console.log('Deleted successfully');
    } catch (e) {
      console.error('Delete error:', e);
    }
  } else {
    console.log('No tests found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
