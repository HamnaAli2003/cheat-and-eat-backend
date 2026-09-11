import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TRACKER_KEEP_SLUGS,
  TRACKER_KEEP_SLUG_SET,
  pickKeeper,
} from "../database/seeds/trackerFoodDedup.js";
import { TRACKER_FOOD_ADDITIONS } from "../database/seeds/trackerFoodAdditions.js";

test("tracker keep slugs are unique and well-formed", () => {
  assert.equal(new Set(TRACKER_KEEP_SLUGS).size, TRACKER_KEEP_SLUGS.length);
  for (const slug of TRACKER_KEEP_SLUGS) {
    assert.match(slug, /^[a-z0-9-]+$/, `bad slug: ${slug}`);
  }
  assert.ok(TRACKER_KEEP_SLUGS.length > 30, "keep list should cover the tracker configs");
});

test("tracker keep slugs never overlap the newly-added foods", () => {
  const added = new Set(TRACKER_FOOD_ADDITIONS.map((f) => f.slug));
  const overlap = TRACKER_KEEP_SLUGS.filter((s) => added.has(s));
  assert.deepEqual(overlap, []);
});

test("pickKeeper prefers a tracker-mapped slug above all", () => {
  const rows = [
    { slug: "punjab-bread-aloo-paratha", region: "Punjab", id: 10 },
    { slug: "common-across-pakistan-bread-aloo-paratha", region: "Common Across Pakistan", id: 5 },
    { slug: "sindh-bread-aloo-paratha", region: "Sindh", id: 20 },
  ];
  assert.equal(pickKeeper(rows), 1);
});

test("pickKeeper prefers Common Across Pakistan over regions", () => {
  const rows = [
    { slug: "punjab-bread-naan", region: "Punjab", id: 10 },
    { slug: "common-across-pakistan-bread-naan", region: "Common Across Pakistan", id: 5 },
    { slug: "sindh-bread-naan", region: "Sindh", id: 20 },
  ];
  assert.equal(pickKeeper(rows), 1);
});

test("pickKeeper prefers the legacy null-region row over region rows", () => {
  const rows = [
    { slug: "punjab-bread-roti", region: "Punjab", id: 10 },
    { slug: "roti", region: null, id: 3 },
    { slug: "sindh-bread-roti", region: "Sindh", id: 20 },
  ];
  assert.equal(pickKeeper(rows), 1);
});

test("pickKeeper falls back to the lowest id among region variants", () => {
  const rows = [
    { slug: "punjab-fruit-mango", region: "Punjab", id: 50 },
    { slug: "sindh-fruit-mango", region: "Sindh", id: 30 },
  ];
  assert.equal(pickKeeper(rows), 1);
});

test("pickKeeper breaks equal-rank ties by lower id", () => {
  const rows = [
    { slug: "a", region: null, id: 10 },
    { slug: "b", region: null, id: 4 },
    { slug: "c", region: null, id: 7 },
  ];
  assert.equal(pickKeeper(rows), 1);
});