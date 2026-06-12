import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.time('search');
  const res = await prisma.question.findMany({
    where: {
      OR: [
        { id: { contains: "search_term", mode: "insensitive" } },
        { content_json: { string_contains: "search_term" } }
      ]
    },
    take: 10
  });
  console.timeEnd('search');
  console.log('Results:', res.length);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
