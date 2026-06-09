import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const stats = await prisma.userStats.findUnique({ where: { user_id: '123' } });
    const rank = await prisma.userStats.count({
      where: { total_score: { gt: stats?.total_score ?? 0 } },
    });
    console.log("Success", rank);
  } catch(e) {
    console.error(e);
  }
}
run();
