import pg from "pg";
import "dotenv/config";
(async () => {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const cols = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='goals' ORDER BY ordinal_position`
  );
  console.log("=== goals columns ===");
  for (const r of cols.rows) console.log(`${r.column_name.padEnd(24)} ${r.data_type}`);
  const g = await c.query(`SELECT id, user_id, daily_calorie_goal, weight_loss_goal_kg, weight_loss_months FROM goals LIMIT 5`);
  for (const r of g.rows) {
    console.log(`goal id=${r.id} user=${r.user_id} calories=${JSON.stringify(r.daily_calorie_goal)} (${typeof r.daily_calorie_goal}) wlGoal=${JSON.stringify(r.weight_loss_goal_kg)} (${typeof r.weight_loss_goal_kg}) wlMonths=${JSON.stringify(r.weight_loss_months)} (${typeof r.weight_loss_months})`);
  }
  await c.end();
})();