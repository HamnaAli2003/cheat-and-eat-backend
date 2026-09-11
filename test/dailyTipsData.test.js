import { test } from "node:test";
import assert from "node:assert/strict";
import { DAILY_TIPS } from "../database/seeds/dailyTipsData.js";

test("DAILY_TIPS contains at least one tip", () => {
  assert.ok(Array.isArray(DAILY_TIPS));
  assert.ok(DAILY_TIPS.length >= 1, "expected at least one tip");
});

test("each tip has a text and an icon and unique text", () => {
  const texts = new Set();

  for (const tip of DAILY_TIPS) {
    assert.equal(typeof tip.text, "string", "tip.text must be a string");
    assert.ok(tip.text.trim().length > 0, "tip.text must not be empty");
    assert.equal(typeof tip.icon, "string", "tip.icon must be a string");
    assert.ok(texts.has(tip.text) === false, "tip texts must be unique");
    texts.add(tip.text);
  }
});