/**
 * Sync Routes from SQL Server (Total Service) to PostgreSQL (ZEUS)
 *
 * This is a READ-ONLY operation - only SELECTs from SQL Server
 * Safe to run while others are using the system
 */

import sql from 'mssql';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SQL Server connection config
const sqlConfig: sql.config = {
  server: process.env.MSSQL_SERVER || '',
  port: 1433,
  database: process.env.MSSQL_DATABASE || '',
  user: process.env.MSSQL_USER || '',
  password: process.env.MSSQL_PASSWORD || '',
  options: {
    encrypt: false, // For older SQL Server 2008
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function syncRoutes() {
  console.log('Starting Route sync from SQL Server...');
  console.log(`Connecting to ${sqlConfig.server}/${sqlConfig.database}...`);

  try {
    // Connect to SQL Server
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server!');

    // Query Routes table (READ ONLY)
    console.log('Fetching routes from SQL Server...');
    const result = await pool.request().query(`
      SELECT
        ID as id,
        Name as name,
        Mech as mech,
        Loc as loc,
        Elev as elev,
        Hour as hour,
        Amount as amount,
        Remarks as remarks,
        Symbol as symbol,
        En as en
      FROM Route
      ORDER BY ID
    `);

    console.log(`Found ${result.recordset.length} routes in SQL Server`);

    // Sync each route to PostgreSQL
    let created = 0;
    let updated = 0;

    for (const row of result.recordset) {
      const routeData = {
        id: row.id,
        name: row.name || '',
        mech: row.mech,
        loc: row.loc || 0,
        elev: row.elev || 0,
        hour: row.hour || 0,
        amount: row.amount || 0,
        remarks: row.remarks,
        symbol: row.symbol,
        en: row.en ?? 1,
      };

      // Upsert - update if exists, create if not
      const existing = await prisma.route.findUnique({
        where: { id: routeData.id },
      });

      if (existing) {
        await prisma.route.update({
          where: { id: routeData.id },
          data: routeData,
        });
        updated++;
      } else {
        await prisma.route.create({
          data: routeData,
        });
        created++;
      }

      console.log(`  Route ${routeData.id}: ${routeData.name}`);
    }

    console.log('\n--- Sync Complete ---');
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total: ${result.recordset.length}`);

    // Close connections
    await pool.close();
    await prisma.$disconnect();

  } catch (error) {
    console.error('Sync failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the sync
syncRoutes();
