import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "zach.schwartz@nouveauelevator.com" },
    update: {
      password: hashedPassword,
      role: "Admin"
    },
    create: {
      email: "zach.schwartz@nouveauelevator.com",
      name: "Zach Schwartz",
      password: hashedPassword,
      role: "Admin"
    },
  });

  console.log("User ready:", user.email);
  console.log("Password: admin123");
  console.log("Role:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
