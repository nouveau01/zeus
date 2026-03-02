// SQL Server Prisma Client - READ ONLY connection to Total Service
// This module handles the case where SQL Server client isn't available (e.g., on Mac dev)

let PrismaClient: any;
let sqlserverAvailable = false;

try {
  // Dynamic require to prevent build-time errors when module doesn't exist
  PrismaClient = require("@prisma/client-sqlserver").PrismaClient;
  sqlserverAvailable = true;
} catch (e) {
  // SQL Server Prisma client not available
  sqlserverAvailable = false;
}

const globalForPrisma = globalThis as unknown as {
  sqlserver: any | undefined;
};

let sqlserver: any = null;

if (sqlserverAvailable && PrismaClient) {
  sqlserver =
    globalForPrisma.sqlserver ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.sqlserver = sqlserver;
  }
}

// Helper to check if SQL Server is available
// ZEUS reads exclusively from PostgreSQL — SQL Server sync is handled externally
export const isSqlServerAvailable = () => false;

// Export a proxy that throws helpful errors when SQL Server isn't available
const sqlserverProxy = new Proxy({} as any, {
  get(target, prop) {
    if (!sqlserverAvailable || !sqlserver) {
      throw new Error(
        "SQL Server connection not available. Make sure @prisma/client-sqlserver is generated and DATABASE_URL_SQLSERVER is configured."
      );
    }
    return sqlserver[prop];
  },
});

export default sqlserverAvailable ? sqlserver : sqlserverProxy;
