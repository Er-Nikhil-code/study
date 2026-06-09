import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.auditLog.deleteMany({});
  console.log("Cleared audit logs");
}
run();
