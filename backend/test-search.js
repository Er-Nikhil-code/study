const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.question.findMany({
      where: {
        OR: [
          { id: { contains: "search", mode: "insensitive" } },
          { content_json: { string_contains: "search" } }
        ]
      },
      take: 1
    });
    console.log('Success!', res.length);
  } catch (e) {
    console.error(e.message);
  }
}

main().finally(() => prisma.$disconnect());
