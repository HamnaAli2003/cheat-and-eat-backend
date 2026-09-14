import "dotenv/config";
import prisma from "../src/config/prisma.js";
import {
  createGoal,
  findGoalByUserId,
  updateGoal,
  insertGoalChange,
  findGoalChangesUntil,
} from "../src/repositories/goalRepository.js";

let testUserId;

try {
  // Create temporary user
  const testUser = await prisma.users.create({
    data: {
      name: "Goal Test User",
      email: "goal-test@example.com",
      password_hash: "temporary-test-hash",
    },
  });

  testUserId = testUser.id;

  // Test createGoal()
  const createdGoal = await createGoal({
    userId: testUserId,
    dailyCalorieGoal: 1800,
    weightLossGoalKg: 10,
    weightLossMonths: 5,
  });

  console.log("Created goal:", createdGoal);

  // Test findGoalByUserId()
  const foundGoal = await findGoalByUserId(testUserId);

  console.log("Found goal:", foundGoal);

  // Test updateGoal()
  const updatedGoal = await updateGoal({
    userId: testUserId,
    dailyCalorieGoal: 1700,
    weightLossGoalKg: 8,
    weightLossMonths: 4,
  });

  console.log("Updated goal:", updatedGoal);

  // Test insertGoalChange()
  const change1 = await insertGoalChange({
    userId: testUserId,
    dailyCalorieGoal: 1800,
    changedOn: new Date("2026-09-01"),
  });

  const change2 = await insertGoalChange({
    userId: testUserId,
    dailyCalorieGoal: 1700,
    changedOn: new Date("2026-09-10"),
  });

  console.log("Inserted goal changes:", change1, change2);

  // Test findGoalChangesUntil()
  const changes = await findGoalChangesUntil({
    userId: testUserId,
    until: new Date("2026-09-30"),
  });

  console.log("Goal changes:", changes);
} catch (error) {
  console.error("❌ Test failed:", error);
} finally {
  // Delete temporary user.
  // Related goal and goal_changes should cascade if DB relations are configured that way.
  if (testUserId) {
    await prisma.users.delete({
      where: {
        id: testUserId,
      },
    });
  }

  await prisma.$disconnect();
}