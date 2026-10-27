import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  // Neon can take a few seconds to wake up; the 2s default makes transactions fail (P2028).
  transactionOptions: { maxWait: 10_000, timeout: 15_000 },
});
