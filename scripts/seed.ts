import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Test Org",
      users: {
        create: {
          email: "admin@test.com",
          role: "ADMIN",
        },
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Demo Project",
      apiKey: "proj_test_123",
      organizationId: org.id,
    },
  });

  console.log("ORG ID:", org.id);
  console.log("PROJECT ID:", project.id);
  console.log("API KEY:", project.apiKey);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
