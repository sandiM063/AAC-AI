import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@aac.app";
  const password = await bcrypt.hash("demo12345", 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: "Demo",
      lastName: "User",
      emailVerified: true,
    },
    create: {
      email,
      password,
      firstName: "Demo",
      lastName: "User",
      emailVerified: true,
    },
  });

  console.log("Seed complete. Demo login:");
  console.log("  Email:    demo@aac.app");
  console.log("  Password: demo12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
