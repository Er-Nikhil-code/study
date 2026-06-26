import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.attempt.count({
      where: { score: { gt: NaN } }
    });
    console.log("Success");
  } catch (e: any) {
    console.log("Error name:", e.name);
    console.log("Error message:", e.message);
  }
}
main();
