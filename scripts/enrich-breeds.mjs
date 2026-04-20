/**
 * enrich-breeds.mjs
 *
 * Enriches the FCI breed list with data from three sources:
 *   1. dogapi.dog      — weight, lifespan, hypoallergenic (free, no key)
 *   2. Italian Wikipedia REST API — Italian descriptions + photos (free, CC license)
 *
 * Seeker attributes are generated separately by generate-seeker-attributes.mjs (Claude API).
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

// ─── Load manual overrides ────────────────────────────────────────────────────

const overridesPath = resolve(__dirname, "manual-overrides.json");
if (!existsSync(overridesPath)) {
  writeFileSync(overridesPath, JSON.stringify({
    "_instructions": "Keyed by FCI breed slug. Fields here override auto-fetched data. Add entries for breeds not covered by automated sources.",
    "_example": {
      "cirneco-dell-etna": {
        "description_it": "Il Cirneco dell'Etna è una razza canina italiana antica originaria della Sicilia...",
        "seeker_attributes": {
          "height_min_cm": 42,
          "height_max_cm": 50,
          "coat_type": "corto",
          "drooling": 1,
          "exercise_needs": 4,
          "apartment_suitable": 3,
          "first_time_owner": 3
        }
      }
    }
  }, null, 2));
  console.log("   Created scripts/manual-overrides.json (add manual entries here).\n");
}
const overrides = JSON.parse(readFileSync(overridesPath, "utf8"));

// ─── Main enrichment loop ─────────────────────────────────────────────────────

// ─── Load existing enriched data (to preserve seeker_attributes) ─────────────

const existingPath = resolve(ROOT, "src/data/razze-enriched.json");
const existingData = {};
if (existsSync(existingPath)) {
  const existing = JSON.parse(readFileSync(existingPath, "utf8"));
  for (const b of existing) existingData[b.slug] = b;
  console.log(`   Loaded ${existing.length} existing enriched breeds (preserving seeker_attributes).\n`);
}

console.log("🔄 Enriching breeds...\n");
const enriched = [];
let dogapiHits = 0, wikiHits = 0, commonsHits = 0, fciHits = 0;

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
    seeker_attributes: null,
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
  if (override.seeker_attributes) {
    result.seeker_attributes = override.seeker_attributes;
    result.sources.seeker_attributes = "manual";
  }
  if (override.weight_min_kg) result.weight_min_kg = override.weight_min_kg;
  if (override.weight_max_kg) result.weight_max_kg = override.weight_max_kg;
  if (override.lifespan_min) result.lifespan_min = override.lifespan_min;
  if (override.lifespan_max) result.lifespan_max = override.lifespan_max;

  // Preserve existing seeker_attributes from previous generation run
  if (!result.seeker_attributes && existingData[breed.slug]?.seeker_attributes) {
    result.seeker_attributes = existingData[breed.slug].seeker_attributes;
    result.sources.seeker_attributes = existingData[breed.slug].sources?.seeker_attributes ?? "Claude AI";
  }

  enriched.push(result);

  const flags = [
    dogapiMatch ? "🐶" : "  ",
    result.description_it ? "📝" : "  ",
    result.photo_url ? "📷" : "  ",
    result.seeker_attributes ? "🎯" : "  ",
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
const withSeeker = enriched.filter((b) => b.seeker_attributes).length;
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
  Seeker attributes:    ${withSeeker} / ${enriched.length}  (Claude AI)
  Weight data:          ${withWeight} / ${enriched.length}  (dogapi.dog)

  Still missing photos: ${enriched.length - withPhoto} — add to scripts/manual-overrides.json
  Missing seeker attrs: ${enriched.length - withSeeker} — run generate-seeker-attributes.mjs

Data sources per breed are stored in each entry's "sources" field.
`);
