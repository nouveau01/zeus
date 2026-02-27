/**
 * Seed script: Fills empty tables and gaps with realistic mock data.
 * Run with: npx tsx scripts/seed-mock.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Elevator industry realistic data ────────────────────────────

const UNIT_TYPES = ["Passenger", "Freight", "Escalator", "Dumbwaiter", "Service"];
const UNIT_CATS = ["Electric", "Hydraulic", "Traction", "MRL"];
const MANUFACTURERS = ["Otis", "ThyssenKrupp", "KONE", "Schindler", "Mitsubishi", "Fujitec", "Hollister-Whitney", "Canton"];
const UNIT_STATUSES = ["Active", "Inactive", "Out of Service"];

const VENDOR_DATA = [
  { name: "Hollister-Whitney Elevator Corp", type: "Parts", city: "Quincy", state: "IL", phone: "(217) 222-5401" },
  { name: "GAL Manufacturing", type: "Parts", city: "Bronx", state: "NY", phone: "(718) 402-6100" },
  { name: "Elevator Controls Corp", type: "Parts", city: "Sacramento", state: "CA", phone: "(916) 381-5240" },
  { name: "Adams Elevator Equipment", type: "Parts", city: "Niles", state: "IL", phone: "(847) 966-1950" },
  { name: "EHC Industries", type: "Parts", city: "Mississauga", state: "ON", phone: "(905) 820-6300" },
  { name: "Columbia Elevator Products", type: "Parts", city: "Carrollton", state: "TX", phone: "(972) 484-0031" },
  { name: "Interstate Elevator Supply", type: "Parts", city: "Long Island City", state: "NY", phone: "(718) 361-1140" },
  { name: "Draka Elevator Products", type: "Wire/Cable", city: "Piscataway", state: "NJ", phone: "(732) 562-4400" },
  { name: "Wittur Group", type: "Doors", city: "Wiedenzhausen", state: "DE", phone: "+49 8136 42-0" },
  { name: "Sharp Electronics Corp", type: "Controls", city: "Montvale", state: "NJ", phone: "(201) 529-8200" },
  { name: "American Safety Elevator", type: "Service", city: "Brooklyn", state: "NY", phone: "(718) 788-5600" },
  { name: "TK Elevator Americas", type: "OEM", city: "Atlanta", state: "GA", phone: "(404) 745-7000" },
  { name: "Delco Elevator Corp", type: "Service", city: "Patchogue", state: "NY", phone: "(631) 654-5050" },
  { name: "Motion Control Engineering", type: "Controls", city: "Rancho Cordova", state: "CA", phone: "(916) 463-9200" },
  { name: "EPCO Elevator Parts", type: "Parts", city: "Jamaica", state: "NY", phone: "(718) 526-0909" },
];

const PO_DESCRIPTIONS = [
  "Door operator assembly - Model 6970",
  "Hydraulic cylinder rebuild kit",
  "Car door panels (stainless steel) x4",
  "Traction machine motor replacement",
  "Controller board upgrade MCE-4000",
  "Safety edge and detector set",
  "Cab interior renovation materials",
  "Wire rope 5/8\" (500 ft spool)",
  "Guide shoes and gibs replacement set",
  "Emergency phone units x6",
  "LED lighting fixtures for cab",
  "Pit equipment (buffers and channels)",
  "Governor rope and tension sheave",
  "Roller guides complete set",
  "Hoist motor brake assembly",
];

const RECEIPT_DESCRIPTIONS = [
  "Payment - 195 Broadway maintenance",
  "Payment - 708 3rd Avenue quarterly service",
  "Wire transfer - One Grand Central Place modernization",
  "Check deposit - Multiple small accounts",
  "Payment - Cab renovation project",
  "Wire transfer - Annual contract renewal",
  "Payment - Emergency repair service",
  "Check deposit - Quarterly billing cycle",
  "Wire transfer - New installation progress payment",
  "Payment - Inspection and testing fees",
];

// ─── Seed functions ──────────────────────────────────────────────

async function seedUnits() {
  console.log("\n--- Seeding Units ---");
  // Find accounts without units
  const accountsWithUnits = await prisma.unit.findMany({ select: { premisesId: true }, distinct: ["premisesId"] });
  const accountIdsWithUnits = new Set(accountsWithUnits.map(u => u.premisesId).filter(Boolean));

  const allAccounts = await prisma.premises.findMany({ select: { id: true, premisesId: true, name: true } });
  const accountsWithoutUnits = allAccounts.filter(a => !accountIdsWithUnits.has(a.id));

  console.log(`  Found ${accountsWithoutUnits.length} accounts without units (of ${allAccounts.length} total)`);

  let created = 0;
  for (const acct of accountsWithoutUnits) {
    const numUnits = 1 + Math.floor(Math.random() * 4); // 1-4 units
    for (let i = 1; i <= numUnits; i++) {
      const unitType = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
      const cat = UNIT_CATS[Math.floor(Math.random() * UNIT_CATS.length)];
      const mfr = MANUFACTURERS[Math.floor(Math.random() * MANUFACTURERS.length)];

      await prisma.unit.create({
        data: {
          premisesId: acct.id,
          unitNumber: `E${i}`,
          unitType,
          cat,
          manufacturer: mfr,
          serial: `${mfr.substring(0, 3).toUpperCase()}-${10000 + Math.floor(Math.random() * 90000)}`,
          status: UNIT_STATUSES[0], // Active
          state: `NY-${100000 + Math.floor(Math.random() * 900000)}`,
        },
      });
      created++;
    }
  }
  console.log(`  Created ${created} units`);
}

async function seedVendors() {
  console.log("\n--- Seeding Vendors ---");
  const existing = await prisma.vendor.count();
  if (existing > 0) { console.log(`  Skipping — ${existing} vendors already exist`); return; }

  for (const v of VENDOR_DATA) {
    await prisma.vendor.create({
      data: {
        name: v.name,
        type: v.type,
        status: 1,
        balance: 0,
        city: v.city,
        state: v.state,
        phone: v.phone,
        address: `${100 + Math.floor(Math.random() * 900)} ${["Main St", "Industrial Blvd", "Commerce Dr", "Factory Ln", "Tech Park Rd"][Math.floor(Math.random() * 5)]}`,
        zipCode: `${10000 + Math.floor(Math.random() * 90000)}`,
        isActive: true,
      },
    });
  }
  console.log(`  Created ${VENDOR_DATA.length} vendors`);
}

async function seedPurchaseOrders() {
  console.log("\n--- Seeding Purchase Orders ---");
  const existing = await prisma.purchaseOrder.count();
  if (existing > 0) { console.log(`  Skipping — ${existing} POs already exist`); return; }

  const vendors = await prisma.vendor.findMany({ select: { id: true } });
  if (vendors.length === 0) { console.log("  No vendors — skipping POs"); return; }

  const statuses = [0, 1, 1, 1, 2]; // 0=Draft, 1=Approved, 2=Received
  let poNum = 5001;

  for (let i = 0; i < 15; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const amount = Math.round((500 + Math.random() * 25000) * 100) / 100;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    await prisma.purchaseOrder.create({
      data: {
        poNumber: poNum++,
        vendorId: vendor.id,
        fDate: date,
        fDesc: PO_DESCRIPTIONS[i % PO_DESCRIPTIONS.length],
        amount,
        status,
        approved: status >= 1 ? 1 : 0,
        approvedBy: status >= 1 ? "ZSchwartz" : null,
        dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
        terms: 30,
      },
    });
  }
  console.log(`  Created 15 purchase orders`);
}

async function seedBankAccounts() {
  console.log("\n--- Seeding Bank Accounts ---");
  const existing = await prisma.bankAccount.count();
  if (existing > 0) { console.log(`  Skipping — ${existing} bank accounts already exist`); return; }

  const banks = [
    { fDesc: "Chase Operating Account", balance: 245800.50, accountNumber: "****4521", routingNumber: "021000021" },
    { fDesc: "Chase Payroll Account", balance: 82350.00, accountNumber: "****7832", routingNumber: "021000021" },
    { fDesc: "TD Bank Reserve Account", balance: 150000.00, accountNumber: "****1294", routingNumber: "031101266" },
  ];

  for (const b of banks) {
    await prisma.bankAccount.create({
      data: {
        fDesc: b.fDesc,
        balance: b.balance,
        accountNumber: b.accountNumber,
        routingNumber: b.routingNumber,
        nextCheck: 1001,
        nextDeposit: 101,
        status: 1,
        inUse: 1,
      },
    });
  }
  console.log(`  Created 3 bank accounts`);
}

async function seedCashReceipts() {
  console.log("\n--- Seeding Cash Receipts ---");
  const existing = await prisma.cashReceipt.count();
  if (existing > 0) { console.log(`  Skipping — ${existing} cash receipts already exist`); return; }

  const banks = await prisma.bankAccount.findMany({ select: { id: true } });
  if (banks.length === 0) { console.log("  No bank accounts — skipping"); return; }

  let refNum = 10001;
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const amount = Math.round((1000 + Math.random() * 50000) * 100) / 100;
    const bank = banks[Math.floor(Math.random() * banks.length)];

    await prisma.cashReceipt.create({
      data: {
        refNumber: refNum++,
        date,
        description: RECEIPT_DESCRIPTIONS[i],
        amount,
        bankAccountId: bank.id,
      },
    });
  }
  console.log(`  Created 10 cash receipts`);
}

async function seedContacts() {
  console.log("\n--- Seeding Contacts ---");
  const existing = await prisma.contact.count();
  if (existing > 0) { console.log(`  Skipping — ${existing} contacts already exist`); return; }

  const customers = await prisma.customer.findMany({ select: { id: true, name: true }, take: 20 });
  if (customers.length === 0) { console.log("  No customers — skipping"); return; }

  const firstNames = ["John", "Sarah", "Mike", "Lisa", "David", "Maria", "James", "Jennifer", "Robert", "Emily", "Carlos", "Patricia", "Kevin", "Diana", "Thomas"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Davis", "Miller", "Wilson", "Taylor", "Anderson", "Martinez", "Garcia", "Lopez", "Chen", "Kim"];
  const titles = ["Building Manager", "Property Manager", "Superintendent", "Facilities Director", "Operations Manager", "VP Operations", "Chief Engineer", "Office Manager"];

  let created = 0;
  for (const customer of customers) {
    const numContacts = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numContacts; i++) {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];

      await prisma.contact.create({
        data: {
          name: `${first} ${last}`,
          title,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@${customer.name.replace(/[^a-zA-Z]/g, "").substring(0, 10).toLowerCase()}.com`,
          phone: `(${212 + Math.floor(Math.random() * 5)}) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`,
          customerId: customer.id,
        },
      });
      created++;
    }
  }
  console.log(`  Created ${created} contacts`);
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("=== ZEUS Mock Data Seeder ===");

  try {
    await seedUnits();
    await seedVendors();
    await seedBankAccounts();
    await seedPurchaseOrders();
    await seedCashReceipts();
    await seedContacts();

    // Summary
    console.log("\n=== Summary ===");
    const counts = {
      customers: await prisma.customer.count(),
      accounts: await prisma.premises.count(),
      units: await prisma.unit.count(),
      jobs: await prisma.job.count(),
      invoices: await prisma.invoice.count(),
      tickets: await prisma.ticket.count(),
      vendors: await prisma.vendor.count(),
      purchaseOrders: await prisma.purchaseOrder.count(),
      bankAccounts: await prisma.bankAccount.count(),
      cashReceipts: await prisma.cashReceipt.count(),
      contacts: await prisma.contact.count(),
    };
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table}: ${count}`);
    }

    console.log("\nDone!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
