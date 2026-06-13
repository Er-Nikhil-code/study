require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const attempts = await prisma.attempt.findMany({
    where: { status: 'SCORED' },
    include: {
      test: {
        include: {
          test_questions: {
            include: { question: true }
          }
        }
      }
    }
  });

  console.log(`Found ${attempts.length} scored attempts`);

  for (const a of attempts) {
    let actualMaxScore = 0;
    for (const tq of a.test.test_questions) {
      actualMaxScore += a.test.positive_marks || tq.marks_override || tq.question?.marks || 0;
    }
    
    if (a.max_score !== actualMaxScore) {
      console.log(`Fixing attempt ${a.id}: max_score ${a.max_score} -> ${actualMaxScore}`);
      await prisma.attempt.update({
        where: { id: a.id },
        data: { max_score: actualMaxScore }
      });
    }
  }

  // Recalculate UserStats for all users
  const users = await prisma.userStats.findMany();
  for (const u of users) {
    const userAttempts = await prisma.attempt.findMany({
      where: { user_id: u.user_id, status: "SCORED", attempt_no: 1 },
      select: { score: true, max_score: true },
    });

    if (userAttempts.length > 0) {
      const avgAccuracy =
        userAttempts.reduce(
          (s, a) =>
            s + ((a.score || 0) / (a.max_score || 1)) * 100,
          0,
        ) / userAttempts.length;

      await prisma.userStats.update({
        where: { user_id: u.user_id },
        data: { avg_accuracy: Math.round(avgAccuracy * 100) / 100 }
      });
    }
  }

  console.log("Done");
  await prisma.$disconnect();
}

fix().catch(console.error);
