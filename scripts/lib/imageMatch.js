/*
 * ============================================================
 * SHARED IMAGE-MATCH SCORING
 * ============================================================
 * Used by searchFoodImageCandidates.js and assignFoodImages.js so
 * candidate scoring and final assignment eligibility always agree.
 *
 * A candidate is HIGH (auto-assignable) only if:
 *   - the title clearly overlaps the food name, and
 *   - the title does not contain a hard-reject token indicating the
 *     file actually depicts something else (a person, place, object,
 *     plant, event, etc.).
 *
 * Hard-reject words are king: anything matching drops to REJECT even
 * if the overlap math looks good. Fast token-only overlap is not
 * enough on its own (e.g. "Amla" -> "Hashim Amla", "Apple (Saib)" ->
 * "Apple M1", "Gwadar Date" -> "International Date Line").
 */

const REGION_WORDS = new Set([
  "lahori", "karachi", "quetta", "peshawari", "sindhi", "sindh", "balochi",
  "kashmiri", "gilgit", "charsi", "memoni", "multani", "punjabi", "bohri",
  "gwadar", "turbat", "swat", "bong", "shinwari", "gujranwala", "gb",
  "wazwan", "hyderabadi", "hydrabady", "burns", "road", "jinnah", "qissa",
  "khwani", "fort", "port", "grand", "darya", "hollywood", "cafe", "anarkali",
  "bazaar", "do", "plaza", "street", "tower",
]);

const NON_FOOD = [
  "hotel", "restaurant", "restaurante", "cafe", "cafeteri", "diner", "tavern",
  "shop", "store", "bazaar", "mall", "supermarket", "outlet",
  "building", "tower", "bridge", "road", "street", "avenue", "square", "plaza",
  "mountain", "hill", "valley", "desert", "ocean", "sea", "river", "lake",
  "city", "village", "town", "metro", "railway", "station", "airport", "museum",
  "mosque", "temple", "church", "shrine", "palace", "monument", "statue",
  "cemetery", "cemetiere", "sign", "billboard", "poster", "banner", "logo",
  "map of", "icon", "cap", "bottle", "carton", "label", "boutique",
  "flower", "rose", "water lily", "nymphaea", "bird", "parrot", "butterfly",
  "insect", "cat", "dog", "horse", "person", "people", "portrait",
  "selling", "display", "shelf", "stall", "cart", "hand", "hands", "promo",
  "launch", "skyline", "sunset", "painting", "drawing", "convention",
  "shelf", "browse", "grill shelf",
];

/*
 * Titles containing any of these depict a different subject than the
 * named food (e.g. celebrities, gadgets, plants, events, bottles) even
 * when a token happens to coincide. These are observed false positives.
 */
const HARD_REJECT = [
  "tree", "trees", "leaves", "leaf", "vine", "vineyard", "root", "plant",
  "wine", "chip", "m1", "a11", "tone", "second tone", "independence",
  "quaker", "popped", "residence", "machida", "usg", "cupola",
  "sant", "cuniculus", "rabbit", "conference", "vegas", "house",
  "parasite", "moving", "wind", "date line", "tow kway", "philippe",
  "couture", "sapling", "garden center", "mushroom", "senior",
  "hashim", "cricket", "waterfall", "sagar", "buljol",
  "flowers", "flower", "lily", "botanic", "hex", "swatch",
  "sanitising", "sanitizing", "lascar", "puerta", "djibril", "yanivski",
  "tucker", "ruia", "gefilte", "chai ling", "amla ashok",
  "tamale", "danish",
];

/*
 * Titles for one dish are not evidence for another dish. If the title
 * mentions a clearly different dish name that is NOT part of this
 * food's name, the image almost never depicts the requested food.
 */
const DISH_WORDS = [
  "biryani", "kebab", "kabab", "karahi", "qorma", "korma", "curry", "halwa",
  "pulao", "polao", "samosa", "naan", "paratha", "roti", "chai", "sharbat",
  "lassi", "pakora", "kulfi", "falooda", "chawal", "mithai", "jalebi",
  "haleem", "kheer", "pie",
];

const wordHit = (titleLower, keyword) => {
  const re = new RegExp("(^|[\\s\\-_0-9])" + keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([\\s\\-_0-9]|$)", "i");
  return re.test(titleLower);
};

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);

const tokens = (s) => norm(s);

const cleanTitle = (t) =>
  String(t || "")
    .replace(/^File:\s*/i, "")
    .replace(/\.(jpe?g|png|gif|webp|svg|jfif|bmp|tiff?)$/i, "")
    .trim();

const titleFromUrl = (url) => {
  if (!url) return null;
  const last = decodeURIComponent(url.split("/").pop() || "")
    .replace(/\.(jpe?g|png|gif|webp|svg|jfif|bmp|tiff?)$/i, "")
    .replace(/_/g, " ")
    .trim();
  if (!last || /^special:filepath/i.test(last)) return null;
  return last;
};

const overlap = (a, b) => {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0) return 0;
  const common = ta.filter((t) => tb.includes(t)).length;
  return common / ta.length;
};

function scoreName(name, title, license) {
  const tc = cleanTitle(title).toLowerCase();
  for (const k of HARD_REJECT) {
    if (wordHit(tc, k)) return { conf: 0, level: "REJECT", reason: "hard-reject:" + k };
  }
  for (const k of NON_FOOD) {
    if (wordHit(tc, k)) return { conf: 0, level: "REJECT", reason: "non-food:" + k };
  }
  const fullNameTokens = norm(name.replace(/\(.*?\)/g, " "));
  for (const tt of tokens(tc)) {
    if (DISH_WORDS.includes(tt) && !fullNameTokens.includes(tt)) {
      return { conf: 0, level: "REJECT", reason: "dish-word-mismatch:" + tt };
    }
  }
  for (const tt of tokens(tc)) {
    if (tt === "egg" && !fullNameTokens.includes("egg") && !fullNameTokens.includes("eggs")) {
      return { conf: 0, level: "REJECT", reason: "ingredient-photo:egg" };
    }
  }
  const core = fullNameTokens.filter((t) => !REGION_WORDS.has(t));
  const nt = core.length ? core : fullNameTokens;
  if (!nt.length) return { conf: 0, level: "REJECT", reason: "no tokens" };
  const tt = tokens(tc);
  const common = nt.filter((t) => tt.includes(t)).length;
  const o = common / nt.length;
  let conf;
  let reason;
  if (nt.length === 1) {
    const exactHit = tt.includes(nt[0]);
    const titleOnlyOne = tt.length === 1;
    conf = exactHit && titleOnlyOne ? 0.85 : exactHit ? 0.65 : 0;
    reason = exactHit && titleOnlyOne ? "single-token exact" : exactHit ? "single-token embedded in multi-word title" : "no overlap";
  } else {
    conf = o;
    reason = `${common}/${nt.length} token(s)`;
  }
  if (license === "cc0" || license === "pdm") conf = Math.min(1, conf + 0.05);
  conf = Math.round(conf * 100) / 100;
  const level = conf >= 0.75 ? "HIGH" : conf >= 0.4 ? "MEDIUM" : conf > 0 ? "LOW" : "REJECT";
  return { conf, level, reason };
}

export { REGION_WORDS, NON_FOOD, HARD_REJECT, DISH_WORDS, norm, tokens, cleanTitle, titleFromUrl, overlap, scoreName };