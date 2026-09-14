import { PrismaClient } from "@prisma/client";
import pg from "pg";
import env from "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export default prisma;

