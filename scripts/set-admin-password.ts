import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.update({
    where: { email: "zach.schwartz@nouveauelevator.com" },
    data: {
      password: hashedPassword,
      role: "Admin"
    },
  });

  console.log("Updated user:", user.email);
  console.log("Password set to: admin123");
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
