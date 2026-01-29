// SQL Server Prisma Client - READ ONLY connection to Total Service
import { PrismaClient } from "@prisma/client-sqlserver";

const globalForPrisma = globalThis as unknown as {
  sqlserver: PrismaClient | undefined;
};

export const sqlserver =
  globalForPrisma.sqlserver ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.sqlserver = sqlserver;

export default sqlserver;
