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

  // Create customers and store their IDs
  const customerIds: string[] = [];
  for (const customerData of customersData) {
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        type: customerData.type,
        isActive: customerData.isActive,
        balance: customerData.balance,
      },
    });
    customerIds.push(customer.id);
  }
  console.log(`Created ${customersData.length} customers`);

  // Premises/Accounts data from Total Service screenshot
  const premisesData = [
    { premisesId: "1-5BOND", name: "1-5 BOND STREET", address: "318 LAFAYETTE STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1-9NDPBIMC", name: "1-9 NATHAN D.PERLMAN PLACE NYC", address: "FIRST AVENUE @ 16TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1-9wFORDHAM***", name: "1-9 WEST FORDHAM ROAD", address: "1-9 WEST FORDHAM ROAD", city: "BRONX", state: "NY", type: "S", isActive: true, balance: 3602.79 },
    { premisesId: "1-9wFORDHAMBLIN", name: "1-9 WEST FORDHAM ROAD - BLINK FITNESS", address: "1-9 WEST FORDHAM ROAD", city: "BRONX", state: "NY", type: "Non-Contract", isActive: true, balance: 0 },
    { premisesId: "10-12CHESTNUT**", name: "10-12 CHESTNUT STREET", address: "10-12 CHESTNUT STREET", city: "SUFFERN", state: "NY", type: "S", isActive: true, balance: 263.46 },
    { premisesId: "10-12NDPBI", name: "10-12 NATHAN D.PERLMAN PLACE", address: "10-12 NATHAND", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "10-2746THAVE", name: "10-27 46TH AVENUE", address: "10-27 46TH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100 W44", name: "100 WEST 44th STREET", address: "100W44", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100-106EBROAD", name: "100-106 EAST BROAD STREET", address: "100-106 EAST BROAD STREET", city: "ELIZABETH", state: "NJ", type: "Non-Contract", isActive: true, balance: 0 },
    { premisesId: "100-1723RD*****", name: "100-17 23RD AVENUE - ELMHURST", address: "QUEENSBRIDGE SOUTH", city: "LONG ISLAND CITY", state: "NY", type: "SH", isActive: true, balance: 604906.32 },
    { premisesId: "100-1723RDTRADE", name: "100-17 23RD TRADES", address: "125 PARK AVENUE, SUITE 1530", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 835.80 },
    { premisesId: "100-30DIT*****", name: "100-30 DITMARS BOULEVARD", address: "100-30 DITMARS BOULEVARD", city: "EAST ELMHURST", state: "NY", type: "S", isActive: true, balance: 70286.56 },
    { premisesId: "1000 PELHAM PKW", name: "1000PEL", address: "MORNINGSIDE NURSING & REHAB", city: "BRONX", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100010THAVE****", name: "1000 10TH AVENUE", address: "1000 10TH AVENUE", city: "NEW YORK", state: "NY", type: "Resident Mech.", isActive: true, balance: 637927.61 },
    { premisesId: "1000CAS", name: "1000 CASTLE ROAD", address: "1000 CASTLE ROAD", city: "Secaucus", state: "NJ", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000FIF", name: "1000 FIFTH AVENUE", address: "1000 FIFTH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000FRA", name: "1000 FRANKLIN AVENUE", address: "c/o STEEL EQUITIES", city: "BETHPAGE", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000MON", name: "1000 MONTAUK HIGHWAY", address: "c/o CHS", city: "ROCKVILLE CENTRE", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000PEL****", name: "1000 PELHAM PARKWAY SOUTH", address: "1000 PELHAM PARKWAY SOUTH", city: "BRONX", state: "NY", type: "S", isActive: true, balance: 21989.72 },
    { premisesId: "1000PELMMC", name: "1000 PELHAM PARKWAY SOUTH - MMC", address: "1000 PELHAM PARKWAY SOUTH", city: "BRONX", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000SIXTHAVE", name: "1000 SIXTH AVENUE", address: "1000 AVENUE OF THE AMERICAS", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000STEWAR", name: "1000 STEWART AVENUE", address: "1000 Stewart Avenue", city: "GARDEN CITY", state: "NY", type: "Non-Contract", isActive: false, balance: 0.04 },
    { premisesId: "1000STEWART****", name: "1000 STEWART AVENUE - NEWMARK", address: "1000 STEWART AVENUE", city: "GARDEN CITY", state: "NY", type: "H", isActive: true, balance: 636.14 },
    { premisesId: "1000STEWARTLIFE", name: "1000 STEWART AVENUE - LIFETIME BRANDS", address: "1000 STEWART AVENUE", city: "GARDEN CITY", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1000WASHINGT***", name: "1000 WASHINGTON AVENUE - BBG", address: "1000 WASHINGTON AVENUE", city: "BROOKLYN", state: "NY", type: "S", isActive: true, balance: 27365.00 },
    { premisesId: "1001E45", name: "1001 EAST 45th STREET AKA 4502 FARRAGUT", address: "820 ELMONT ROAD", city: "ELMONT", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1001SOYSTER***", name: "1001 SOUTH OYSTER BAY ROAD - NORTHWELL", address: "1001 SOUTH OYSTER BAY ROAD", city: "BETHPAGE", state: "NY", type: "S", isActive: true, balance: 2511.97 },
    { premisesId: "1002GREENACRE**", name: "1002 GREEN ACRES MALL", address: "1002 GREEN ACRES MALL, SPACE 01044", city: "VALLEY STREAM", state: "NY", type: "S", isActive: true, balance: 10842.63 },
    { premisesId: "1002MAHSBC", name: "1002 Madison Avenue", address: "JONES LANG LASALLE INC.95 WASHINGTON ST S", city: "BUFFALO", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1005E179", name: "1005 EAST 179TH STREET", address: "1005 E 179th St", city: "Bronx", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "1009FIF", name: "1009 FIFTH AVENUE", address: "C/O SEBASTIAN CAPITAL", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100AMI", name: "100 AMITY STREET", address: "45 MAIN STREET, SUITE 800", city: "BROOKLYN", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100BALDWIN*****", name: "100 BALDWIN ROAD", address: "100 BALDWIN ROAD", city: "HEMPSTEAD", state: "NY", type: "S", isActive: true, balance: 83874.01 },
    { premisesId: "100BAR", name: "140 WEST STREET CONDOMINIUM", address: "EMAIL ALL INV'S: firstserviceny@avidbill.com", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100BARCLAYMAG", name: "100 BARCLAY - MAGNUM", address: "100 BARCLAY STREET", city: "NEW YORK", state: "NY", type: "MOD", isActive: true, balance: 0 },
    { premisesId: "100BRO", name: "100 BROADWAY", address: "C/O CRAVEN MANAGEMENT CORPORATION", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100BROAD", name: "100 BROAD STREET", address: "100 BROAD STREET", city: "ELIZABETH", state: "NJ", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100BROWAL", name: "100 BROADWAY - DUANE", address: "440 NINTH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100CHURCHST****", name: "100 CHURCH STREET", address: "100 CHURCH STREET", city: "NEW YORK", state: "NY", type: "S", isActive: true, balance: 0 },
    { premisesId: "100CLI", name: "100 CLINTON STREET", address: "340 Court Street", city: "BROOKLYN", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100CLIFTONPL***", name: "100 CLIFTON PLACE", address: "100 CLIFTON PLACE", city: "JERSEY CITY", state: "NJ", type: "S", isActive: true, balance: 0 },
    { premisesId: "100COM", name: "100 COMMUNITY DRIVE", address: "100 Community Dr", city: "Great Neck", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100E77CARRIER", name: "100 EAST 77TH STREET - CARRIER", address: "C/O IBM CORPORATION", city: "ENDICOTT", state: "NY", type: "Non-Contract", isActive: true, balance: 0 },
    { premisesId: "100E77LENO***", name: "100 EAST 77TH ST **MASTER ACCOUNT**", address: "100 EAST 77TH ST", city: "NEW YORK", state: "NY", type: "Resident Mech.", isActive: true, balance: 448379.47 },
    { premisesId: "100E77STEMPIRE", name: "100 EAST 77TH STREET - EMPIRE", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0 },
    { premisesId: "100E77TH", name: "100 EAST 77TH STREET - HANDI-LIFT, INC.", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0 },
    { premisesId: "100E77THJCDUG", name: "100 EAST 77TH STREET - JC DUGGAN", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0 },
    { premisesId: "100EASTOCR", name: "100 EAST OLD COUNTRY ROAD", address: "100 EAST OLD COUNTRY ROAD", city: "Hicksville", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
    { premisesId: "100EFORDHAM****", name: "100 E FORDHAM ROAD", address: "100 E FORDHAM ROAD", city: "BRONX", state: "NY", type: "S", isActive: true, balance: 396.78 },
    { premisesId: "100GAR47", name: "100 GARDEN CITY PLAZA -", address: "ONE OLD COUNTRY RD", city: "CARLE PLACE", state: "NY", type: "Non-Contract", isActive: false, balance: 0 },
  ];

  // Assign premises to random customers
  for (const premisesItem of premisesData) {
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    await prisma.premises.create({
      data: {
        premisesId: premisesItem.premisesId,
        name: premisesItem.name,
        address: premisesItem.address,
        city: premisesItem.city,
        state: premisesItem.state,
        type: premisesItem.type,
        isActive: premisesItem.isActive,
        balance: premisesItem.balance,
        customerId: randomCustomerId,
      },
    });
  }
  console.log(`Created ${premisesData.length} premises/accounts`);

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
