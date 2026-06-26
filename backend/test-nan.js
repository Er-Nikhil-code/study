const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.attempt.count({
      where: { score: { gt: NaN } }
    });
    console.log("Success");
  } catch (e) {
    console.log("Error name:", e.name);
    console.log("Error message:", e.message);
  }
}
main();
