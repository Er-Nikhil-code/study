const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const note = await prisma.note.findFirst();
    if (!note) {
      console.log("No notes found.");
      return;
    }
    
    console.log("Note ID:", note.id);
    console.log("Note Creator:", note.created_by);

    const user = await prisma.user.findFirst();

    // simulate submission
    const data = {
      note_id: note.id,
      reason: "WRONG_EXPLANATION",
      description: "Test description"
    };

    const creatorUser = await prisma.user.findUnique({
      where: { id: note.created_by },
      select: { role: true, assigned_teacher_id: true }
    });

    const assignedToId = creatorUser?.role === "INTERN" && creatorUser.assigned_teacher_id
      ? creatorUser.assigned_teacher_id
      : note.created_by;

    console.log("Assigned To ID:", assignedToId);

    const challenge = await prisma.challenge.create({
      data: {
        note_id: data.note_id,
        submitted_by: user.id,
        assigned_to: assignedToId,
        status: "PENDING",
        reason: data.reason,
        description: data.description,
      },
    });

    console.log("Success! Challenge created:", challenge.id);
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
