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
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.jobHistory.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.premises.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.jobTemplate.deleteMany({});
  await prisma.jobType.deleteMany({});
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

  // Assign premises to random customers and store IDs
  const premisesIds: string[] = [];
  for (const premisesItem of premisesData) {
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const premises = await prisma.premises.create({
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
    premisesIds.push(premises.id);
  }
  console.log(`Created ${premisesData.length} premises/accounts`);

  // Add units to first few premises (like the screenshot shows)
  const unitData = [
    { unitNumber: "PE1", category: "CONSULTANT", unitType: "Elevator", serial: "2P3476", manufacturer: "", status: "Active", description: "PE1" },
    { unitNumber: "PE2", category: "Public", unitType: "Elevator", serial: "2P3477", manufacturer: "Otis", status: "Active", description: "PE2" },
    { unitNumber: "PE3", category: "Service", unitType: "Elevator", serial: "2P3478", manufacturer: "ThyssenKrupp", status: "Active", description: "PE3" },
    { unitNumber: "FE1", category: "Freight", unitType: "Elevator", serial: "FT1001", manufacturer: "Schindler", status: "Active", description: "Freight Elevator 1" },
    { unitNumber: "ES1", category: "Public", unitType: "Escalator", serial: "ES2001", manufacturer: "KONE", status: "Active", description: "Escalator Main" },
  ];

  // Add units to first 10 premises
  for (let i = 0; i < Math.min(10, premisesIds.length); i++) {
    const numUnits = Math.floor(Math.random() * 3) + 1; // 1-3 units per premises
    for (let j = 0; j < numUnits; j++) {
      const unitTemplate = unitData[j % unitData.length];
      await prisma.unit.create({
        data: {
          unitNumber: `${unitTemplate.unitNumber}`,
          cat: unitTemplate.category,
          unitType: unitTemplate.unitType,
          serial: `${unitTemplate.serial}-${i}${j}`,
          manufacturer: unitTemplate.manufacturer,
          status: unitTemplate.status,
          description: unitTemplate.description,
          premisesId: premisesIds[i],
        },
      });
    }
  }
  console.log("Created units for premises");

  // Invoice data from Total Service screenshot
  const invoiceData = [
    { invoiceNumber: 1, date: "2001-03-12", type: "Other", total: 181.86, status: "Paid" },
    { invoiceNumber: 314, date: "1999-12-16", type: "Other", total: 132.82, status: "Paid" },
    { invoiceNumber: 706, date: "2000-10-23", type: "Other", total: -8621.25, status: "Paid" },
    { invoiceNumber: 716, date: "2000-10-26", type: "Other", total: -62.91, status: "Paid" },
    { invoiceNumber: 950, date: "2001-05-17", type: "Other", total: 264.00, status: "Paid" },
    { invoiceNumber: 978, date: "2001-06-21", type: "Other", total: -16123.50, status: "Paid" },
    { invoiceNumber: 979, date: "2001-06-21", type: "Other", total: -16123.50, status: "Paid" },
    { invoiceNumber: 1158, date: "2001-08-02", type: "Other", total: -13418.76, status: "Paid" },
    { invoiceNumber: 1277, date: "2001-01-05", type: "Other", total: -160.00, status: "Paid" },
    { invoiceNumber: 1432, date: "2002-01-18", type: "Other", total: -14817.00, status: "Paid" },
    { invoiceNumber: 1553, date: "2002-01-31", type: "Other", total: 0.00, status: "Void" },
    { invoiceNumber: 1557, date: "2002-01-31", type: "Other", total: 0.00, status: "Void" },
    { invoiceNumber: 1603, date: "2002-02-12", type: "Other", total: -20.00, status: "Paid" },
    { invoiceNumber: 1616, date: "2002-02-25", type: "Other", total: -10.00, status: "Paid" },
    { invoiceNumber: 1662, date: "2002-04-03", type: "Other", total: -200.00, status: "Paid" },
    { invoiceNumber: 1671, date: "2002-04-09", type: "Other", total: -2381.50, status: "Paid" },
    { invoiceNumber: 1672, date: "2002-04-09", type: "Other", total: -275.00, status: "Paid" },
    { invoiceNumber: 1710, date: "2002-04-25", type: "Other", total: -1293.59, status: "Paid" },
    { invoiceNumber: 1715, date: "2002-04-30", type: "Other", total: -2381.50, status: "Paid" },
    { invoiceNumber: 1725, date: "2002-05-20", type: "Other", total: -200.00, status: "Paid" },
    { invoiceNumber: 1743, date: "2002-05-24", type: "Other", total: -316.44, status: "Paid" },
    { invoiceNumber: 1744, date: "2002-05-24", type: "Other", total: -315.00, status: "Paid" },
    { invoiceNumber: 1752, date: "2002-05-30", type: "Other", total: -4449.08, status: "Paid" },
    { invoiceNumber: 1755, date: "2002-06-04", type: "Other", total: -1158.34, status: "Paid" },
    { invoiceNumber: 1761, date: "2002-06-10", type: "Other", total: -2381.50, status: "Paid" },
    { invoiceNumber: 1966, date: "2002-11-18", type: "Other", total: -4717.07, status: "Open" },
    { invoiceNumber: 1999, date: "2002-12-06", type: "Other", total: -1158.34, status: "Paid" },
    { invoiceNumber: 2020, date: "2003-01-09", type: "Other", total: -1158.34, status: "Paid" },
    { invoiceNumber: 2032, date: "2003-01-15", type: "Other", total: -166.66, status: "Paid" },
  ];

  // Create invoices with line items
  for (const invData of invoiceData) {
    const randomPremisesId = premisesIds[Math.floor(Math.random() * premisesIds.length)];

    await prisma.invoice.create({
      data: {
        invoiceNumber: invData.invoiceNumber,
        postingDate: new Date(invData.date),
        date: new Date(invData.date),
        type: invData.type,
        terms: "Net 30 Days",
        status: invData.status,
        description: `Imported Invoice for Job #`,
        taxable: 0,
        nonTaxable: invData.total,
        subTotal: invData.total,
        salesTax: 0,
        total: invData.total,
        remainingUnpaid: invData.status === "Paid" ? 0 : invData.total,
        emailStatusCode: 0,
        premisesId: randomPremisesId,
        items: {
          create: [
            {
              name: "GENERAL",
              quantity: 1,
              description: "Invoice Item",
              tax: false,
              price: invData.total,
              markupPercent: 0,
              amount: invData.total,
              measure: "Each",
              phase: 0,
            },
          ],
        },
      },
    });
  }
  console.log(`Created ${invoiceData.length} invoices`);

  // Completed Tickets data from Total Service screenshot
  const ticketData = [
    { ticketNumber: 3870484, workOrderNumber: 3870484, date: "2026-01-16T14:34:00", type: "Other", category: "Maintenance", accountId: "110WIL***", mechCrew: "LONDIS, GEORGE", hours: 6.75, unitName: "WC", status: "Completed" },
    { ticketNumber: 3939921, workOrderNumber: 3939921, date: "2026-01-16T15:46:00", type: "Other", category: "Maintenance", accountId: "100HAVEN2***", mechCrew: "FOWLER T (RES-CUMC)", hours: 0.50, unitName: "NORTH", status: "Completed" },
    { ticketNumber: 3941769, workOrderNumber: 3941769, date: "2026-01-16T15:42:00", type: "Other", category: "None", accountId: "50HAV***", mechCrew: "FOWLER T (RES-CUMC)", hours: 0.75, unitName: "BARD P1", status: "Completed" },
    { ticketNumber: 3941864, workOrderNumber: 3941864, date: "2026-01-15T13:40:00", type: "Other", category: "None", accountId: "60HAV***", mechCrew: "FOWLER T (RES-CUMC)", hours: 2.25, unitName: "SOUTH", status: "Completed" },
    { ticketNumber: 3956778, workOrderNumber: 3956778, date: "2026-01-16T12:29:00", type: "Other", category: "None", accountId: "701W168***", mechCrew: "DIXON J - Supervisor", hours: 1.00, unitName: "HAMMER H", status: "Completed" },
    { ticketNumber: 3961794, workOrderNumber: 3961794, date: "2026-01-16T14:42:00", type: "Other", category: "None", accountId: "722W168***", mechCrew: "FOWLER T (RES-CUMC)", hours: 2.00, unitName: "PSYCH 3", status: "Completed" },
    { ticketNumber: 3966188, workOrderNumber: 3966188, date: "2026-01-16T16:28:00", type: "Other", category: "Maintenance", accountId: "250W57***", mechCrew: "MELENDEZ, C", hours: 1.25, unitName: "LOW RISE 1", status: "Completed" },
    { ticketNumber: 3966308, workOrderNumber: 3966308, date: "2026-01-16T07:44:00", type: "Other", category: "None", accountId: "184LEXINGTON***", mechCrew: "ARLOTTA MATTHEW", hours: 0.00, unitName: "P1", status: "Completed" },
    { ticketNumber: 3985910, workOrderNumber: 3985910, date: "2026-01-16T10:25:00", type: "Maintenance", category: "Maintenance", accountId: "66W38TH***", mechCrew: "SANFILIPPO KENNETH", hours: 1.00, unitName: "P4", status: "Completed" },
    { ticketNumber: 3999968, workOrderNumber: 3999968, date: "2026-01-16T09:19:00", type: "Maintenance", category: "None", accountId: "445GOLDST***", mechCrew: "SHUPAC", hours: 2.00, unitName: "", status: "Completed" },
    { ticketNumber: 4005774, workOrderNumber: 4005774, date: "2026-01-16T13:58:00", type: "Maintenance", category: "None", accountId: "150E42***", mechCrew: "SULLIVAN, R", hours: 6.25, unitName: "PE23 - C BA", status: "Completed" },
    { ticketNumber: 4005775, workOrderNumber: 4005775, date: "2026-01-17T05:33:00", type: "Maintenance", category: "None", accountId: "150E42***", mechCrew: "SULLIVAN, R", hours: 1.25, unitName: "PE24 - C BA", status: "Completed" },
    { ticketNumber: 4006902, workOrderNumber: 4006902, date: "2026-01-15T07:27:00", type: "Maintenance", category: "Maintenance", accountId: "25W32ST***", mechCrew: "", hours: 0.00, unitName: "P2", status: "Completed", vd: true },
    { ticketNumber: 4007443, workOrderNumber: 4007443, date: "2026-01-16T15:15:00", type: "Maintenance", category: "Maintenance", accountId: "30LINCOLN***", mechCrew: "LYNCH, THOMAS", hours: 0.25, unitName: "P07 - NORTH", status: "Completed" },
    { ticketNumber: 4009478, workOrderNumber: 4009478, date: "2026-01-16T12:44:00", type: "Maintenance", category: "Maintenance", accountId: "620W168***", mechCrew: "FONTANEZ, AL (RES-CUMC)", hours: 4.00, unitName: "P/S4", status: "Completed" },
    { ticketNumber: 4011725, workOrderNumber: 4011725, date: "2026-01-15T11:06:00", type: "Other", category: "Maintenance", accountId: "114FIFTHAVE***", mechCrew: "FALLON, SEAN", hours: 1.00, unitName: "P5", status: "Completed" },
    { ticketNumber: 4015256, workOrderNumber: 4015256, date: "2026-01-16T11:41:00", type: "Other", category: "Maintenance", accountId: "116JOH***", mechCrew: "FALLON, SEAN", hours: 2.00, unitName: "Car 6", status: "Completed" },
    { ticketNumber: 4031169, workOrderNumber: 4031169, date: "2026-01-16T14:29:00", type: "Maintenance", category: "Maintenance", accountId: "10E45***", mechCrew: "TURNER C", hours: 1.25, unitName: "NEW", status: "Completed" },
    { ticketNumber: 4033068, workOrderNumber: 4033068, date: "2026-01-15T07:27:14", type: "Maintenance", category: "Maintenance", accountId: "25W32ST", mechCrew: "", hours: 0.00, unitName: "P2", status: "Completed", vd: true },
    { ticketNumber: 4033634, workOrderNumber: 4033634, date: "2026-01-15T15:25:00", type: "Maintenance", category: "Maintenance", accountId: "30LINCOLN***", mechCrew: "LYNCH, THOMAS", hours: 0.25, unitName: "P09 - NORTH", status: "Completed" },
    { ticketNumber: 4034189, workOrderNumber: 4034189, date: "2026-01-16T13:50:00", type: "Maintenance", category: "Maintenance", accountId: "400W55TH***", mechCrew: "MELENDEZ, C", hours: 0.75, unitName: "P1", status: "Completed" },
    { ticketNumber: 4034190, workOrderNumber: 4034190, date: "2026-01-15T13:00:00", type: "Maintenance", category: "Maintenance", accountId: "400W55TH***", mechCrew: "MELENDEZ, C", hours: 0.50, unitName: "P2", status: "Completed" },
    { ticketNumber: 4035680, workOrderNumber: 4035680, date: "2026-01-16T16:54:00", type: "Maintenance", category: "Maintenance", accountId: "620W168***", mechCrew: "FONTANEZ, AL (RES-CUMC)", hours: 4.00, unitName: "P/S2", status: "Completed" },
    { ticketNumber: 4037674, workOrderNumber: 4037674, date: "2026-01-15T12:28:00", type: "Other", category: "Maintenance", accountId: "275MADRPW***", mechCrew: "SYLVESTER, RONALD", hours: 2.00, unitName: "LOW RISE 3", status: "Completed" },
    { ticketNumber: 4041746, workOrderNumber: 4041746, date: "2026-01-15T14:08:00", type: "Maintenance", category: "Maintenance", accountId: "114FIFTHAVE***", mechCrew: "FALLON, SEAN", hours: 1.25, unitName: "P7", status: "Completed" },
    { ticketNumber: 4042974, workOrderNumber: 4042974, date: "2026-01-16T11:06:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "CISOWSKI, NICHOLAS", hours: 1.00, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042981, workOrderNumber: 4042981, date: "2026-01-16T12:04:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "CISOWSKI, NICHOLAS", hours: 1.25, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042991, workOrderNumber: 4042991, date: "2026-01-16T13:12:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "CISOWSKI, NICHOLAS", hours: 1.75, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042995, workOrderNumber: 4042995, date: "2026-01-16T15:24:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "MELENDEZ, C", hours: 0.00, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042997, workOrderNumber: 4042997, date: "2026-01-16T07:40:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "MELENDEZ, C", hours: 1.00, unitName: "COMM PASS", status: "Completed" },
  ];

  // Create tickets
  for (const tData of ticketData) {
    const randomPremisesId = premisesIds[Math.floor(Math.random() * premisesIds.length)];

    await prisma.ticket.create({
      data: {
        ticketNumber: tData.ticketNumber,
        workOrderNumber: tData.workOrderNumber,
        date: new Date(tData.date),
        type: tData.type,
        category: tData.category,
        status: tData.status,
        accountId: tData.accountId,
        mechCrew: tData.mechCrew,
        hours: tData.hours,
        unitName: tData.unitName,
        bill: false,
        reviewed: false,
        pr: false,
        vd: tData.vd || false,
        inv: false,
        emailStatus: "No Email Sent",
        premisesId: randomPremisesId,
      },
    });
  }
  console.log(`Created ${ticketData.length} completed tickets`);

  // Jobs data from Total Service Job Maintenance screenshot
  const jobsData = [
    { externalId: "210372", accountId: "475SEA***", accountTag: "475 SEAVIEW AVENUE", date: "2026-01-21", description: "REPLACE DOOR DETECTOR EDGE - CAR 5P652", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210371", accountId: "475SEA***", accountTag: "475 SEAVIEW AVENUE", date: "2026-01-21", description: "CORRECT LEAKS - FLORINA 2", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210370", accountId: "37E64THST***", accountTag: "37 EAST 64TH STREET", date: "2026-01-21", description: "2026 PERIODIC - 1P15788 #S1", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-01" },
    { externalId: "210369", accountId: "475SEA***", accountTag: "475 SEAVIEW AVENUE", date: "2026-01-21", description: "CORRECT LEAKS - FLORINA 1", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210368", accountId: "35E64THST****", accountTag: "35 EAST 64TH STREET", date: "2026-01-21", description: "2026 PERIODIC - 1P2655 #PE1", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-21" },
    { externalId: "210367", accountId: "31W47***", accountTag: "31 WEST 47th STREET", date: "2026-01-21", description: "SHUTDOWN - WATER DAMAGE - 1/7/2026 - ELEVATOR 1P8391", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210366", accountId: "75VAN*****", accountTag: "75 VANDERBILT AVE", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210365", accountId: "1160TEL***", accountTag: "1160 TELLER AVE. BRONX NY", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210364", accountId: "375PEARL***", accountTag: "375 PEARL STREET", date: "2026-01-21", description: "NC: HOIST CABLE SHORTENINGS CARS 7 AND 9", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210363", accountId: "114FIFTHAVE***", accountTag: "114 FIFTH AVENUE", date: "2026-01-21", description: "014224195H - 1P3774 #P1 AND 1P3771 #P2", type: "Other", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210362", accountId: "1010UND***", accountTag: "1010 UNDERHILL AVENUE", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210361", accountId: "612ALLERTON***", accountTag: "612 ALLERTON AVENUE", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210360", accountId: "43NWHI***", accountTag: "43 NORTH WHITE HORSE PIKE", date: "2026-01-21", description: "2026 ANNUAL PRESSURE TEST", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210359", accountId: "2999SCH***", accountTag: "2999 SCHURZ AVENUE", date: "2026-01-21", description: "REPLACE PISTON SEAL #2P10423", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-27" },
    { externalId: "210358", accountId: "1CAROWPL***", accountTag: "1 CAROW PLACE", date: "2026-01-21", description: "2026 ANNUAL INSPECTION", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210357", accountId: "445GOLDST***", accountTag: "445 GOLD STREET", date: "2026-01-21", description: "R&R REPAIR BRAKE SWITCHES - CITY ID# 3P13802", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210356", accountId: "400W119***", accountTag: "400 WEST 119TH ST. NYC**#3", date: "2026-01-21", description: "2026 PERIODIC 1P14293 #P3-C", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210355", accountId: "400W119***", accountTag: "400 WEST 119TH ST. NYC**#3", date: "2026-01-21", description: "2026 PERIODIC 1P14291 #P1-A", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210354", accountId: "619W113ST", accountTag: "CUA-619W113ST", date: "2026-01-21", description: "2026 PERIODIC 1P47576 #179", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210353", accountId: "511W114ST", accountTag: "CUA:JOHN,JAY", date: "2026-01-21", description: "2026 PERIODIC 1F202#112", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210352", accountId: "575BRO***", accountTag: "575 BROADWAY", date: "2026-01-21", description: "2025 PERIODIC - 1P42026 #P1", type: "Other", status: "Hold", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210351", accountId: "411W116ST", accountTag: "CUA-WIEN HALL", date: "2026-01-21", description: "N/C - HOIST CABLE SHORTENING CARS 20 & 21", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210350", accountId: "2900BROADWAY", accountTag: "CUA-BROADWAY RESIDENTIAL CO-OP", date: "2026-01-21", description: "N/C - HOIST CABLE SHORTENING CARS 142 & 143", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210349", accountId: "3030BROADWAY", accountTag: "CUA-DODGE NGYM", date: "2026-01-21", description: "N/C - REVIEW SEAL - CAR 32", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210348", accountId: "96-05HORACE****", accountTag: "96-05 HORACE HARDING EXPRESSWAY", date: "2026-01-21", description: "NC ADJUST BRAKE - CAR 2", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210347", accountId: "3227BROADWAY", accountTag: "CUM:JEROME L GREEN SCIENCE CENTER", date: "2026-01-21", description: "VIO-FTF-VT-CAT1-201812-00003208- 1W6961", type: "Violations", status: "Completed", template: "Filing Fee", dueDate: "2026-01-21" },
    { externalId: "210346", accountId: "3600RT12***", accountTag: "3600 ROUTE 112", date: "2026-01-21", description: "2026 SEMI ANNUAL INSPECTION", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210345", accountId: "29-33LECOUNT***", accountTag: "29-33 LECOUNT PLACE", date: "2026-01-21", description: "2025 ANNUAL RESULTS - LETTER", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-21" },
    { externalId: "210344", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-21", description: "2026 PERIODIC - 1P15742 #CAR 14", type: "Other", status: "Hold", template: "Inspection / Correction", dueDate: "2026-01-21" },
    { externalId: "210343", accountId: "29-33LECOUNT***", accountTag: "29-33 LECOUNT PLACE", date: "2026-01-20", description: "NC REPLACE HYDRAULIC PISTON SEALS - CAR 4", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-20" },
    { externalId: "210342", accountId: "59MAIDEN***", accountTag: "59 MAIDEN LANE", date: "2026-01-20", description: "NC: HOIST CABLE SHORTENING CARS 16 AND 18", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210341", accountId: "224HAM***", accountTag: "224 HAMBURG TPK - WAYNE NJ", date: "2026-01-20", description: "REPLACE DOOR OPERATOR BOARD - CAR 1", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210340", accountId: "MTALIRRRESC***", accountTag: "MTA LIRR ESCALATORS", date: "2026-01-20", description: "MTA LIRR ESCALATORS - PENN STATION - MATERIAL ONLY", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210339", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P3579 #CAR 17", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210338", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15741 #CAR 13", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210337", accountId: "200USHIGHWAY1**", accountTag: "200 US HIGHWAY 1", date: "2026-01-20", description: "REPLACE FREIGHT DOOR GUIDE SHOES - CAR 17", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-20" },
    { externalId: "210336", accountId: "279BUTLERST***", accountTag: "279 BUTLER STREET", date: "2026-01-20", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-20" },
    { externalId: "210335", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15740 #CAR 12", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210334", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15739 #CAR 11", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-20" },
    { externalId: "210333", accountId: "200USHIGHWAY1**", accountTag: "200 US HIGHWAY 1", date: "2026-01-20", description: "REPLACE DOOR DETECTOR EDGE - CAR 13", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-20" },
    { externalId: "210332", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15738 #CAR 10", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-20" },
    { externalId: "210331", accountId: "270PARKAVE*****", accountTag: "270 PARK AVENUE", date: "2026-01-20", description: "CAT 2026 N/C", type: "Annual", status: "Open", template: "Annual 2026 Non-Billable", dueDate: "2026-01-15" },
    { externalId: "210330", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15737 #CAR 09", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210329", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15736 #CAR 08", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210328", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15735 #CAR 07", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210327", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15734 #CAR 06", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210326", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15733 #CAR 05", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210325", accountId: "667MADISON***", accountTag: "667 MADISON AVENUE", date: "2026-01-20", description: "S/D NC: COMP CABLE SHORTENING CAR 5", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210324", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15732 #CAR 04", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
  ];

  // Create jobs
  for (const jobData of jobsData) {
    const randomPremisesId = premisesIds[Math.floor(Math.random() * premisesIds.length)];
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];

    await prisma.job.create({
      data: {
        externalId: jobData.externalId,
        jobName: jobData.description,
        jobDescription: jobData.description,
        date: new Date(jobData.date),
        dueDate: new Date(jobData.dueDate),
        type: jobData.type,
        status: jobData.status,
        template: jobData.template,
        premisesId: randomPremisesId,
        customerId: randomCustomerId,
      },
    });
  }
  console.log(`Created ${jobsData.length} jobs`);

  // Create Job Types
  const jobTypesData = [
    { name: "Annual", sortOrder: 1 },
    { name: "Maintenance", sortOrder: 2 },
    { name: "Modernization", sortOrder: 3 },
    { name: "Repair", sortOrder: 4 },
    { name: "NEW REPAIR", sortOrder: 5 },
    { name: "Violations", sortOrder: 6 },
    { name: "Capital Impro", sortOrder: 7 },
    { name: "CONSULTANT", sortOrder: 8 },
    { name: "BILLING ONL", sortOrder: 9 },
    { name: "GL Incidents", sortOrder: 10 },
    { name: "LAWSUITS", sortOrder: 11 },
    { name: "NO CHARGE", sortOrder: 12 },
    { name: "Touchless", sortOrder: 13 },
    { name: "XCALL", sortOrder: 14 },
    { name: "Other", sortOrder: 99 },
  ];

  const jobTypeMap: Record<string, string> = {};
  for (const typeData of jobTypesData) {
    const jobType = await prisma.jobType.create({
      data: typeData,
    });
    jobTypeMap[typeData.name] = jobType.id;
  }
  console.log(`Created ${jobTypesData.length} job types`);

  // Create Job Templates (from Total Service screenshot)
  const jobTemplatesData = [
    { name: "3D Edge", type: "NEW REPAIR", revNum: 1, expNum: 2 },
    { name: "Annual", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2015", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2016", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2017 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2017 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2018 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2018 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2019 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2019 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2020 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2020 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2021 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2021 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2022 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2022 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2023 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2023 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2024 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2024 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2025 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2025 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2026 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2026 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Capital Improvement", type: "Capital Impro", revNum: 1, expNum: 2 },
    { name: "CONSULTANT REPORT", type: "CONSULTANT", revNum: 1, expNum: 2 },
    { name: "DO NOT USE (DIV REPAIR)", type: "Repair", revNum: 1, expNum: 2, isActive: false },
    { name: "DO NOT USE (Repair)", type: "Repair", revNum: 1, expNum: 2, isActive: false },
    { name: "Filing Fee", type: "Violations", revNum: 1, expNum: 2 },
    { name: "FOR SERVICES RENDERED", type: "BILLING ONL", revNum: 1, expNum: 2 },
    { name: "GL INCIDENTS", type: "GL Incidents", revNum: 1, expNum: 2 },
    { name: "GL INCIDENTS - ILLINOIS", type: "GL Incidents", revNum: 1, expNum: 2 },
    { name: "INACTIVE", type: "Other", revNum: 1, expNum: 2, isActive: false },
    { name: "Inspection / Correction", type: "Other", revNum: 1, expNum: 2 },
    { name: "LAWSUITS", type: "LAWSUITS", revNum: 1, expNum: 2 },
    { name: "Legal Reimbursements", type: "GL Incidents", revNum: 1, expNum: 2 },
    { name: "LOCAL LAW 10/81", type: "Other", revNum: 1, expNum: 2 },
    { name: "Modernization", type: "Modernization", revNum: 1, expNum: 2 },
    { name: "NEW REPAIRS", type: "NEW REPAIR", revNum: 1, expNum: 2 },
    { name: "NO CHARGE", type: "NO CHARGE", revNum: 1, expNum: 2, isBillable: false },
    { name: "Regular Maintenance", type: "Maintenance", revNum: 1, expNum: 2 },
    { name: "Shop", type: "NO CHARGE", revNum: 1, expNum: 2, isBillable: false },
    { name: "Test", type: "Other", revNum: 1, expNum: 2 },
    { name: "Touchless C", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless CH", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless H", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless L", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless LH", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Vehicles", type: "Other", revNum: 1, expNum: 2 },
    { name: "Violation", type: "Violations", revNum: 1, expNum: 2 },
    { name: "Violations(Inactive)", type: "Other", revNum: 1, expNum: 2, isActive: false },
    { name: "X Call", type: "XCALL", revNum: 1, expNum: 2 },
  ];

  for (const templateData of jobTemplatesData) {
    await prisma.jobTemplate.create({
      data: {
        name: templateData.name,
        typeId: jobTypeMap[templateData.type] || null,
        revNum: templateData.revNum,
        expNum: templateData.expNum,
        isBillable: templateData.isBillable ?? true,
        isActive: templateData.isActive ?? true,
      },
    });
  }
  console.log(`Created ${jobTemplatesData.length} job templates`);

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
