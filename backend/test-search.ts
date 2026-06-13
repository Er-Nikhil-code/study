import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const search = "modern";
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { id: { contains: search, mode: 'insensitive' } },
        { content_json: { string_contains: search } }
      ]
    }
  });
  console.log("Questions found:", questions.length);
  if (questions.length > 0) {
    console.log(questions[0].content_json);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
