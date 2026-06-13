const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const contentManager = await prisma.role.upsert({
      where: { name: 'CONTENT_MANAGER' },
      update: {},
      create: {
        name: 'CONTENT_MANAGER',
        description: 'Manages curriculum and questions',
        designation: 'Content Manager',
        level: 1,
        permissions_json: ["manage_hierarchy", "manage_questions", "create_question"],
      }
    });
    console.log("Success:", contentManager);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
