/**
 * enrich-breeds.mjs
 *
 * Enriches the FCI breed list with data from three sources:
 *   1. dogapi.dog      — weight, lifespan, hypoallergenic (free, no key)
 *   2. Italian Wikipedia REST API — Italian descriptions + photos (free, CC license)
 *   3. AKC website     — quiz attributes: energy, trainability, shedding, etc. (1–5 scores)
 *
 * Output: src/data/razze-enriched.json
 *         scripts/manual-overrides.json  (created on first run if missing, never overwritten)
 *
 * Usage:
 *   node scripts/enrich-breeds.mjs
 *
 * Refresh cadence:
 *   dogapi.dog   → monthly
 *   Wikipedia    → quarterly
 *   AKC          → annually
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "AllevatoriItalia/1.0 (breed-enrichment-script)" },
  });
  if (!res.ok) return null;
  return res.json();
}


function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[àáâ]/g, "a").replace(/[èéê]/g, "e")
    .replace(/[ìíî]/g, "i").replace(/[òóô]/g, "o")
    .replace(/[ùúû]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Load FCI breed list from razze.ts ──────────────────────────────────────

console.log("📖 Loading FCI breed list from razze.ts...");
const razzeTs = readFileSync(resolve(ROOT, "src/data/razze.ts"), "utf8");
// Extract only the array entries (lines starting with { fci_id:)
const breeds = [];
for (const line of razzeTs.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{ fci_id:")) continue;
  const obj = {};
  const fields = [
    "fci_id", "name_it", "name_en", "slug", "group_fci",
    "group_name_it", "size_category", "origin_country",
    "is_italian_breed", "is_popular", "fci_url",
  ];
  for (const field of fields) {
    const match = trimmed.match(new RegExp(`${field}:\\s*([^,}]+)`));
    if (!match) continue;
    let val = match[1].trim().replace(/^["']|["']$/g, "");
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (!isNaN(Number(val)) && val !== "") val = Number(val);
    obj[field] = val;
  }
  if (obj.fci_id) breeds.push(obj);
}

console.log(`   Found ${breeds.length} FCI breeds.\n`);

// ─── Source 1: dogapi.dog ────────────────────────────────────────────────────

console.log("🐶 Fetching dogapi.dog (weight, lifespan, hypoallergenic, descriptions)...");
const dogapiBreeds = [];
let page = 1;
while (true) {
  const data = await fetchJson(`https://dogapi.dog/api/v2/breeds?page[number]=${page}&page[size]=100`);
  if (!data?.data?.length) break;
  dogapiBreeds.push(...data.data);
  if (data.data.length < 100) break;
  page++;
  await sleep(300);
}
console.log(`   Retrieved ${dogapiBreeds.length} breeds from dogapi.dog.\n`);

// Build lookup by normalized name
const dogapiMap = {};
for (const b of dogapiBreeds) {
  const key = b.attributes.name.toLowerCase().trim();
  dogapiMap[key] = b;
}

function matchDogapi(breed) {
  const candidates = [
    breed.name_en.toLowerCase(),
    breed.name_it.toLowerCase(),
    // common name variations
    breed.name_en.toLowerCase().replace("dog", "").trim(),
    breed.name_en.toLowerCase().replace("shepherd", "sheepdog"),
    breed.name_en.toLowerCase().replace("sheepdog", "shepherd"),
  ];
  for (const c of candidates) {
    if (dogapiMap[c]) return dogapiMap[c];
  }
  // partial match
  for (const [key, val] of Object.entries(dogapiMap)) {
    if (key.includes(candidates[0]) || candidates[0].includes(key)) return val;
  }
  return null;
}

// ─── Source 2: Italian Wikipedia ─────────────────────────────────────────────

async function fetchWikipediaIT(breedNameIT, breedNameEN) {
  const attempts = [
    breedNameIT,
    breedNameEN,
    breedNameIT.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("_"),
  ];
  for (const name of attempts) {
    const encoded = encodeURIComponent(name.replace(/ /g, "_"));
    const data = await fetchJson(
      `https://it.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    );
    if (data?.extract && data.extract.length > 50) {
      return {
        description_it: data.extract,
        photo_url: data.thumbnail?.source ?? null,
        photo_credit: data.thumbnail?.source ? "Wikimedia Commons (CC BY-SA)" : null,
        wikipedia_url_it: data.content_urls?.desktop?.page ?? null,
      };
    }
    await sleep(150);
  }
  return null;
}

// ─── Source: Wikimedia Commons image search (fallback for missing photos) ────
// Used when the Wikipedia summary endpoint returns no thumbnail.
// Queries the Commons API directly by breed name for the best available image.

async function fetchWikimediaCommonsPhoto(breedNameIT, breedNameEN) {
  const queries = [breedNameIT, breedNameEN];
  for (const q of queries) {
    const encoded = encodeURIComponent(q);
    const data = await fetchJson(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encoded}&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json`
    );
    const pages = Object.values(data?.query?.pages ?? {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;
      // Only accept actual photos (jpg/png), skip SVGs and diagrams
      if (!info.url.match(/\.(jpg|jpeg|png)/i)) continue;
      const license = info.extmetadata?.License?.value ?? "";
      // Only use free licenses
      if (!license.match(/cc|public.domain/i)) continue;
      const credit = info.extmetadata?.LicenseShortName?.value ?? "Wikimedia Commons (CC)";
      return {
        photo_url: info.thumburl ?? info.url,
        photo_credit: `Wikimedia Commons (${credit})`,
        photo_source: "Wikimedia Commons",
      };
    }
    await sleep(200);
  }
  return null;
}

// ─── Source: FCI illustration (last resort fallback) ─────────────────────────
// FCI publishes standardized breed illustrations at predictable URLs.
// Format: https://www.fci.be/Nomenclature/Illustrations/{id padded to 3}g{group padded to 2}.jpg
// Lower quality (stylized illustrations) but covers all 359 FCI breeds.

async function fetchFCIIllustration(fciId, groupFci) {
  const id = String(fciId).padStart(3, "0");
  const group = String(groupFci).padStart(2, "0");
  const url = `https://www.fci.be/Nomenclature/Illustrations/${id}g${group}.jpg`;
  // HEAD request to check existence without downloading the full image
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": "AllevatoriItalia/1.0" } });
    if (res.ok) {
      return {
        photo_url: url,
        photo_credit: "FCI — Fédération Cynologique Internationale",
        photo_source: "FCI",
      };
    }
    // Some breeds have multiple illustrations (e.g. -1.jpg, -2.jpg)
    const url2 = `https://www.fci.be/Nomenclature/Illustrations/${id}g${group}-1.jpg`;
    const res2 = await fetch(url2, { method: "HEAD", headers: { "User-Agent": "AllevatoriItalia/1.0" } });
    if (res2.ok) {
      return {
        photo_url: url2,
        photo_credit: "FCI — Fédération Cynologique Internationale",
        photo_source: "FCI",
      };
    }
  } catch {
    // network error — skip
  }
  return null;
}

// ─── Source 3: AKC quiz attributes ───────────────────────────────────────────
// AKC exposes breed traits via their WordPress REST API.
// Traits are stored as taxonomy term IDs which we map to 1–5 scores.

// Term ID → numeric score mappings (fetched manually, stable)
const AKC_ACTIVITY = { 19: 1, 2729: 1, 2640: 2, 2645: 4, 21: 5 };        // Couch Potato→1 … Needs Lots→5
const AKC_BARKING  = { 22: 1, 23: 2, 24: 3, 25: 4, 26: 5, 50293: 1 };   // When Necessary→1 … Vocal→5
const AKC_CHILDREN = { 33: 1, 31: 2, 32: 3, 34: 5, 50293: 1 };           // Not Recommended→1 … Yes→5
const AKC_DOGS     = { 35: 1, 36: 3, 37: 5 };                             // Not Recommended→1 … Yes→5
const AKC_SHEDDING = { 38: 1, 2648: 2, 39: 3, 40: 4, 2673: 5 };          // Infrequent→1 … Regularly→5
const AKC_TRAIN    = { 46: 1, 49: 2, 47: 3, 48: 4, 50: 5 };              // Stubborn→1 … Easy→5

function termScore(ids, map) {
  for (const id of (ids ?? [])) {
    if (map[id] !== undefined) return map[id];
  }
  return null;
}

async function fetchAKC(breedNameEN) {
  const slug = breedNameEN
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const data = await fetchJson(
    `https://www.akc.org/wp-json/wp/v2/breed?slug=${slug}&_fields=activity_level,barking_level,good_with_children,good_with_dogs,shedding,trainability`
  );
  if (!data?.length) return null;

  const b = data[0];
  const energy        = termScore(b.activity_level,    AKC_ACTIVITY);
  const barking       = termScore(b.barking_level,     AKC_BARKING);
  const good_children = termScore(b.good_with_children,AKC_CHILDREN);
  const good_dogs     = termScore(b.good_with_dogs,    AKC_DOGS);
  const shedding      = termScore(b.shedding,          AKC_SHEDDING);
  const trainability  = termScore(b.trainability,      AKC_TRAIN);

  if ([energy, barking, good_children, good_dogs, shedding, trainability].every((v) => v === null)) return null;

  return { energy, trainability, shedding, barking, good_with_children: good_children, good_with_other_dogs: good_dogs };
}

// ─── Load manual overrides ────────────────────────────────────────────────────

const overridesPath = resolve(__dirname, "manual-overrides.json");
if (!existsSync(overridesPath)) {
  writeFileSync(overridesPath, JSON.stringify({
    "_instructions": "Keyed by FCI breed slug. Fields here override auto-fetched data. Add entries for breeds not covered by automated sources.",
    "_example": {
      "cirneco-dell-etna": {
        "description_it": "Il Cirneco dell'Etna è una razza canina italiana antica originaria della Sicilia...",
        "quiz_attributes": {
          "energy": 4,
          "trainability": 3,
          "shedding": 2,
          "grooming": 1,
          "good_with_children": 4,
          "good_with_other_dogs": 3
        }
      }
    }
  }, null, 2));
  console.log("   Created scripts/manual-overrides.json (add manual entries here).\n");
}
const overrides = JSON.parse(readFileSync(overridesPath, "utf8"));

// ─── Main enrichment loop ─────────────────────────────────────────────────────

console.log("🔄 Enriching breeds...\n");
const enriched = [];
let dogapiHits = 0, wikiHits = 0, akcHits = 0, commonsHits = 0, fciHits = 0;

for (let i = 0; i < breeds.length; i++) {
  const breed = breeds[i];
  process.stdout.write(`   [${String(i + 1).padStart(3)}/${breeds.length}] ${breed.name_en.padEnd(45)}`);

  const override = overrides[breed.slug] ?? {};
  const result = {
    // ── FCI core (source of truth) ──
    fci_id: breed.fci_id,
    name_it: breed.name_it,
    name_en: breed.name_en,
    slug: breed.slug,
    group_fci: breed.group_fci,
    group_name_it: breed.group_name_it,
    size_category: breed.size_category,
    origin_country: breed.origin_country,
    is_italian_breed: breed.is_italian_breed,
    is_popular: breed.is_popular,
    fci_url: breed.fci_url,
    sources: { fci: "https://www.fci.be" },

    // ── Enriched fields (null until filled) ──
    description_it: null,
    photo_url: null,
    photo_credit: null,
    wikipedia_url_it: null,
    weight_min_kg: null,
    weight_max_kg: null,
    lifespan_min: null,
    lifespan_max: null,
    hypoallergenic: null,
    quiz_attributes: null,
  };

  // 1. dogapi.dog
  const dogapiMatch = matchDogapi(breed);
  if (dogapiMatch) {
    const a = dogapiMatch.attributes;
    result.weight_min_kg = a.male_weight?.min ?? a.female_weight?.min ?? null;
    result.weight_max_kg = a.male_weight?.max ?? a.female_weight?.max ?? null;
    result.lifespan_min = a.life?.min ?? null;
    result.lifespan_max = a.life?.max ?? null;
    result.hypoallergenic = a.hypoallergenic ?? null;
    if (!result.description_it && a.description) {
      // Store English description as fallback if no Italian found
      result.description_en = a.description;
      result.sources.description_en = "https://dogapi.dog";
    }
    dogapiHits++;
  }

  // 2. Italian Wikipedia (description + photo)
  if (!override.description_it) {
    const wiki = await fetchWikipediaIT(breed.name_it, breed.name_en);
    if (wiki) {
      result.description_it = wiki.description_it;
      result.photo_url = wiki.photo_url;
      result.photo_credit = wiki.photo_credit;
      result.wikipedia_url_it = wiki.wikipedia_url_it;
      result.sources.description_it = wiki.wikipedia_url_it ?? "https://it.wikipedia.org";
      if (wiki.photo_url) result.sources.photo = "Wikimedia Commons (CC BY-SA)";
      wikiHits++;
    }
  }

  // 2b. Wikimedia Commons search (fallback photo if Wikipedia had no thumbnail)
  if (!result.photo_url && !override.photo_url) {
    const commons = await fetchWikimediaCommonsPhoto(breed.name_it, breed.name_en);
    if (commons) {
      result.photo_url = commons.photo_url;
      result.photo_credit = commons.photo_credit;
      result.sources.photo = commons.photo_source;
      commonsHits++;
    }
  }

  // 2c. FCI illustration (last resort if still no photo)
  if (!result.photo_url && !override.photo_url && breed.fci_id && breed.group_fci) {
    const fci = await fetchFCIIllustration(breed.fci_id, breed.group_fci);
    if (fci) {
      result.photo_url = fci.photo_url;
      result.photo_credit = fci.photo_credit;
      result.sources.photo = fci.photo_source;
      fciHits++;
    }
  }

  // 3. AKC quiz attributes
  if (!override.quiz_attributes) {
    const akc = await fetchAKC(breed.name_en);
    if (akc) {
      result.quiz_attributes = akc;
      result.sources.quiz_attributes = `https://www.akc.org/dog-breeds/${breed.name_en.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-")}/`;
      akcHits++;
    }
  }

  // Apply manual overrides (always win)
  if (override.description_it) {
    result.description_it = override.description_it;
    result.sources.description_it = "manual";
  }
  if (override.photo_url) {
    result.photo_url = override.photo_url;
    result.photo_credit = override.photo_credit ?? "manual";
    result.sources.photo = "manual";
  }
  if (override.quiz_attributes) {
    result.quiz_attributes = override.quiz_attributes;
    result.sources.quiz_attributes = "manual";
  }
  if (override.weight_min_kg) result.weight_min_kg = override.weight_min_kg;
  if (override.weight_max_kg) result.weight_max_kg = override.weight_max_kg;
  if (override.lifespan_min) result.lifespan_min = override.lifespan_min;
  if (override.lifespan_max) result.lifespan_max = override.lifespan_max;

  enriched.push(result);

  const flags = [
    dogapiMatch ? "🐶" : "  ",
    result.description_it ? "📝" : "  ",
    result.photo_url ? "📷" : "  ",
    result.quiz_attributes ? "🎯" : "  ",
  ].join("");
  process.stdout.write(`${flags}\n`);

  await sleep(200); // be polite to APIs
}

// ─── Write output ─────────────────────────────────────────────────────────────

const outputPath = resolve(ROOT, "src/data/razze-enriched.json");
writeFileSync(outputPath, JSON.stringify(enriched, null, 2));

// ─── Summary ──────────────────────────────────────────────────────────────────

const withDesc   = enriched.filter((b) => b.description_it).length;
const withPhoto  = enriched.filter((b) => b.photo_url).length;
const withQuiz   = enriched.filter((b) => b.quiz_attributes).length;
const withWeight = enriched.filter((b) => b.weight_min_kg).length;

const wikiPhotos  = enriched.filter((b) => b.photo_url && b.sources.photo?.includes("Wikimedia")).length;
const commonsPhotos = enriched.filter((b) => b.photo_url && b.sources.photo === "Wikimedia Commons").length;
const fciPhotos   = enriched.filter((b) => b.photo_url && b.sources.photo === "FCI").length;

console.log(`
✅ Done! Output: src/data/razze-enriched.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total breeds:         ${enriched.length}
  dogapi.dog matches:   ${dogapiHits} / ${enriched.length}
  Italian descriptions: ${withDesc} / ${enriched.length}  (Wikipedia IT)
  Photos total:         ${withPhoto} / ${enriched.length}
    ↳ Wikipedia:        ${wikiPhotos}
    ↳ Commons search:   ${commonsHits}
    ↳ FCI illustration: ${fciHits}
  Quiz attributes:      ${withQuiz} / ${enriched.length}  (AKC)
  Weight data:          ${withWeight} / ${enriched.length}  (dogapi.dog)

  Still missing photos: ${enriched.length - withPhoto} — add to scripts/manual-overrides.json

Data sources per breed are stored in each entry's "sources" field.
`);
