import prisma from "../src/config/prisma.js";

try {
  await prisma.$connect();
  console.log("✅ Prisma connected successfully");
} catch (error) {
  console.error("❌ Prisma connection failed:", error.message);
} finally {
  await prisma.$disconnect();
}