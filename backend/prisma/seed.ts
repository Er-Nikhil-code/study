import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding default roles...");

  const roles = [
    {
      name: "STUDENT",
      description: "Student role for taking tests and viewing results",
      permissions: ["take_test", "view_results", "submit_challenge"],
    },
    {
      name: "TEACHER",
      description: "Teacher role for creating and managing content",
      permissions: [
        "create_question",
        "edit_question",
        "delete_question",
        "create_test",
        "edit_test",
        "publish_test",
        "review_challenge",
      ],
    },
    {
      name: "ADMIN",
      description: "Admin role for system management and moderation",
      permissions: [
        "manage_users",
        "manage_roles",
        "manage_questions",
        "manage_tests",
        "approve_teachers",
        "manage_challenges",
        "view_audit_logs",
        "system_health",
      ],
    },
    {
      name: "PENDING_TEACHER",
      description: "Pending teacher role awaiting admin approval",
      permissions: ["view_profile", "edit_profile"],
    },
  ];

  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
          permissions_json: role.permissions,
        },
      });
      console.log(`✅ Created role: ${role.name}`);
    } else {
      console.log(`⏭️  Role already exists: ${role.name}`);
    }
  }

  console.log("✨ Seeding completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
