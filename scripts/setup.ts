// First-time setup script - run once after fresh install or deploy
// Usage: npm run setup

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 ZEUS Setup Starting...\n");

  // 1. Check database connection
  console.log("1. Checking database connection...");
  try {
    await prisma.$connect();
    console.log("   ✓ PostgreSQL connected\n");
  } catch (error) {
    console.error("   ✗ Database connection failed!");
    console.error("   Make sure PostgreSQL is running and DATABASE_URL is set in .env");
    process.exit(1);
  }

  // 2. Create admin user if doesn't exist
  console.log("2. Setting up admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || "zschwartz@nouveauelevator.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Zach Schwartz";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      profile: "Admin"
    },
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      profile: "Admin"
    },
  });
  console.log(`   ✓ Admin user ready: ${adminUser.email}\n`);

  // 3. Summary
  console.log("═══════════════════════════════════════════");
  console.log("✅ ZEUS Setup Complete!");
  console.log("═══════════════════════════════════════════");
  console.log(`\nAdmin Login:`);
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`\nTo start the app: npm run dev`);
  console.log(`Then visit: http://localhost:3000/login\n`);
}

main()
  .catch((e) => {
    console.error("Setup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
