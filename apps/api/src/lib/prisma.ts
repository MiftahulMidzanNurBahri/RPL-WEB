import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured before initializing Prisma.");
}

export const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl })
});