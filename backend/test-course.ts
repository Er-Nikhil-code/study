import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ select: { course_enrolled: true }, take: 10 });
  const courses = await prisma.course.findMany({ take: 5 });
  console.dir({ users, courses });
}
run();
