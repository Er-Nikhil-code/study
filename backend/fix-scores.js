require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update all Test total_marks
  const tests = await prisma.test.findMany({
    include: {
      test_questions: {
        include: { question: true }
      }
    }
  });

  for (const test of tests) {
    let total = 0;
    for (const tq of test.test_questions) {
      total += tq.marks_override ?? tq.question.marks;
    }
    await prisma.test.update({
      where: { id: test.id },
      data: { total_marks: total }
    });
  }

  // Update all Attempt max_score
  const attempts = await prisma.attempt.findMany({
    include: {
      test: {
        include: { test_questions: { include: { question: true } } }
      }
    }
  });

  for (const attempt of attempts) {
    let max = 0;
    for (const tq of attempt.test.test_questions) {
      max += tq.marks_override ?? tq.question.marks;
    }
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { max_score: max }
    });
  }

  console.log("Done fixing scores!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
