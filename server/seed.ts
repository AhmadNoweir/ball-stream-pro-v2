import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo users
  const password = await bcrypt.hash("password123", 10);

  const users = [
    { username: "Messi_Fan_10", email: "messi@demo.com" },
    { username: "GoalKeeper99", email: "keeper@demo.com" },
    { username: "TacticsGuru", email: "tactics@demo.com" },
    { username: "StadiumHopper", email: "stadium@demo.com" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { username: u.username, email: u.email, passwordHash: password },
    });
  }

  console.log("Seeded 4 demo users (password: password123)");
  console.log("Demo accounts:");
  users.forEach((u) => console.log(`  ${u.email} / password123`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
