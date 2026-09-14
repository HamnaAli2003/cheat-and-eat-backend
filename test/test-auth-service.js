import "dotenv/config";
import prisma from "../src/config/prisma.js";

try {
  const deletedUser = await prisma.users.delete({
    where: {
      email: "prisma-auth-test@example.com",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log("Deleted auth test user:", deletedUser);
} catch (error) {
  console.error("❌ Delete failed:", error);
} finally {
  await prisma.$disconnect();
}