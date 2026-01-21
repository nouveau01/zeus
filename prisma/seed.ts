import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create User
  const user = await prisma.user.upsert({
    where: { email: "zach.schwartz@nouveauelevator.com" },
    update: {},
    create: {
      email: "zach.schwartz@nouveauelevator.com",
      name: "Zach Schwartz",
      role: "Admin",
    },
  });
  console.log("Created user:", user.name);

  // Customer data from Total Service screenshot
  const customersData = [
    { name: "022042 EPIC CANDLER LLC", type: "General", isActive: false, balance: 0 },
    { name: "1 HORSE HOLLOW ROAD", type: "General", isActive: true, balance: 0 },
    { name: "1 HOTEL BROOKLYN BRIDGE", type: "General", isActive: true, balance: 316598.42 },
    { name: "1 LARKIN", type: "General", isActive: true, balance: 0 },
    { name: "1-5 BOND STREET", type: "Commercial", isActive: true, balance: 0 },
    { name: "10 BK STREET OF WHITE PLAINS, LLC", type: "General", isActive: true, balance: 160482.83 },
    { name: "10 EAST 29TH STREET ASSOCIATES LLC", type: "General", isActive: true, balance: 0 },
    { name: "10 EAST 53RD STREET - EQUINOX", type: "General", isActive: true, balance: 0 },
    { name: "10 MONTAGUE TERRACE OWNERS CORP.", type: "General", isActive: true, balance: 0.04 },
    { name: "10 W 18TH OWNER LLC", type: "General", isActive: true, balance: 228417.68 },
    { name: "10 WEST 55th STREET, LLC", type: "Commercial", isActive: true, balance: 0 },
    { name: "10 WEST 56TH STREET LLC", type: "General", isActive: true, balance: 12173.12 },
    { name: "100 CLINTON STREET LLC", type: "General", isActive: true, balance: 0 },
    { name: "100 JOHN", type: "General", isActive: true, balance: 0 },
    { name: "100 MERRICK TT, LLC", type: "General", isActive: true, balance: 0 },
    { name: "100 WALL STREET INVESTMENT", type: "General", isActive: true, balance: 0 },
    { name: "1000 LLC", type: "Commercial", isActive: true, balance: 0 },
    { name: "1000 PELHAM PKWY S", type: "General", isActive: true, balance: 0 },
    { name: "1001 GAMES LLC", type: "General", isActive: true, balance: 0 },
    { name: "101 7TH AVENUE / REGENCY CENTERS", type: "General", isActive: true, balance: 0 },
    { name: "101 WEST 57th STREET HOTEL CORP.", type: "General", isActive: true, balance: 0.05 },
    { name: "1010 EXECUTIVE CENTER LLC", type: "General", isActive: true, balance: 0 },
    { name: "10101 AVENUE D", type: "General", isActive: true, balance: 0 },
    { name: "1025 FIFTH AVENUE, INC.", type: "Property Manage", isActive: true, balance: 0 },
    { name: "104 WEST 29TH STREET LLC", type: "General", isActive: true, balance: 0 },
    { name: "1058 CORPORATION", type: "General", isActive: false, balance: 0 },
    { name: "106 FERRIS STREET, LLC", type: "General", isActive: true, balance: 0 },
    { name: "106 FULTON OWNER LLC", type: "General", isActive: true, balance: 16833.43 },
    { name: "106 WEST 56TH STREET PROPERTY INVESTORS III, LLC", type: "General", isActive: true, balance: 6846.21 },
    { name: "107 NORTHERN BOULEVARD REALTY INC.", type: "Commercial", isActive: true, balance: 0.05 },
    { name: "109-01LIBERTY", type: "General", isActive: true, balance: 0 },
    { name: "11 EAST 44TH STREET, LLC", type: "General", isActive: true, balance: 0 },
    { name: "110 EAST 64TH OWNER LLC", type: "General", isActive: true, balance: 26960.81 },
    { name: "110 WALL STREET L.P.", type: "General", isActive: true, balance: 0 },
    { name: "110-39 71ST AVE OWNERS, LLC", type: "General", isActive: true, balance: 2270.70 },
    { name: "111 LIVINGSTON LLC", type: "General", isActive: true, balance: 0 },
    { name: "111 SYLVAN AVENUE", type: "General", isActive: true, balance: 0 },
    { name: "111 WALL STREET", type: "General", isActive: true, balance: 0 },
  ];

  // Delete existing data in correct order (respecting foreign keys)
  await prisma.activity.deleteMany({});
  await prisma.jobHistory.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.premises.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log("Cleared existing data");

  for (const customerData of customersData) {
    await prisma.customer.create({
      data: {
        name: customerData.name,
        type: customerData.type,
        isActive: customerData.isActive,
        balance: customerData.balance,
      },
    });
  }
  console.log(`Created ${customersData.length} customers`);

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
