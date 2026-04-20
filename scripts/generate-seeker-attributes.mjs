/**
 * generate-seeker-attributes.mjs
 *
 * Uses Claude API to generate seeker-oriented attributes for all FCI breeds.
 * Reads razze-enriched.json, generates SeekerAttributes for each breed,
 * and writes them back into the JSON.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-seeker-attributes.mjs
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-seeker-attributes.mjs --dry-run
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-seeker-attributes.mjs --resume
 *
 * Options:
 *   --dry-run   Process only the first batch and print results without writing
 *   --resume    Skip breeds that already have seeker_attributes
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

const dryRun = process.argv.includes("--dry-run");
const resume = process.argv.includes("--resume");

// ─── Validation ─────────────────────────────────────────────────────────────

const VALID_COAT_TYPES = ["corto", "medio", "lungo", "duro", "riccio", "senza_pelo", "doppio"];
const VALID_PRIMARY_USES = ["compagnia", "guardia", "caccia", "sport", "pastorizia", "terapia", "lavoro", "slitta"];

function validateAttributes(attrs, breedName) {
  const errors = [];

  // Required number fields
  for (const field of ["height_min_cm", "height_max_cm", "drooling", "exercise_needs",
    "apartment_suitable", "alone_tolerance", "first_time_owner", "heat_tolerance", "cold_tolerance"]) {
    if (typeof attrs[field] !== "number") {
      errors.push(`${field} must be a number, got ${typeof attrs[field]}`);
    }
  }

  // 1-5 scale fields
  for (const field of ["drooling", "exercise_needs", "apartment_suitable", "alone_tolerance",
    "first_time_owner", "heat_tolerance", "cold_tolerance"]) {
    if (typeof attrs[field] === "number" && (attrs[field] < 1 || attrs[field] > 5)) {
      errors.push(`${field} must be 1-5, got ${attrs[field]}`);
    }
  }

  // Height sanity
  if (attrs.height_min_cm > attrs.height_max_cm) {
    errors.push(`height_min_cm (${attrs.height_min_cm}) > height_max_cm (${attrs.height_max_cm})`);
  }
  if (attrs.height_min_cm < 5 || attrs.height_max_cm > 120) {
    errors.push(`height range ${attrs.height_min_cm}-${attrs.height_max_cm} seems unrealistic`);
  }

  // Coat type
  if (!VALID_COAT_TYPES.includes(attrs.coat_type)) {
    errors.push(`coat_type "${attrs.coat_type}" is not valid`);
  }

  // Arrays
  if (!Array.isArray(attrs.coat_colors) || attrs.coat_colors.length === 0) {
    errors.push("coat_colors must be a non-empty array");
  }
  if (!Array.isArray(attrs.health_issues) || attrs.health_issues.length < 2) {
    errors.push("health_issues must have at least 2 entries");
  }
  if (!Array.isArray(attrs.primary_use) || attrs.primary_use.length === 0) {
    errors.push("primary_use must be a non-empty array");
  }
  if (Array.isArray(attrs.primary_use)) {
    for (const use of attrs.primary_use) {
      if (!VALID_PRIMARY_USES.includes(use)) {
        errors.push(`primary_use "${use}" is not valid`);
      }
    }
  }

  if (errors.length > 0) {
    console.warn(`   ⚠️  Validation warnings for ${breedName}: ${errors.join("; ")}`);
    return false;
  }
  return true;
}

// ─── Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt(breedsContext) {
  return `You are a canine breed expert. For each breed below, provide seeker_attributes as a JSON object.

IMPORTANT: Return ONLY a JSON array of objects, one per breed, in the same order as the input. Each object must have exactly these fields:
- "slug": the breed slug (for matching)
- "height_min_cm": number — typical minimum adult height at withers in cm
- "height_max_cm": number — typical maximum adult height at withers in cm
- "coat_type": one of "corto", "medio", "lungo", "duro", "riccio", "senza_pelo", "doppio"
- "drooling": 1 (minimal) to 5 (heavy drooler)
- "coat_colors": array of Italian color names (e.g. "nero", "bianco", "marrone", "fulvo", "grigio", "crema", "rosso", "blu", "tricolore", "bicolore", "merle", "sabbia", "focato")
- "exercise_needs": 1 (low, ~20min/day) to 5 (very high, 90+ min/day)
- "apartment_suitable": 1 (not suitable at all) to 5 (ideal for apartments)
- "alone_tolerance": 1 (cannot be left alone) to 5 (handles 8+ hours fine)
- "first_time_owner": 1 (not recommended for novices) to 5 (ideal for beginners)
- "heat_tolerance": 1 (very sensitive to heat) to 5 (excellent heat tolerance)
- "cold_tolerance": 1 (very sensitive to cold) to 5 (excellent cold tolerance)
- "health_issues": array of 2-5 common health concerns in Italian (e.g. "displasia dell'anca", "torsione gastrica", "problemi oculari", "allergie cutanee")
- "primary_use": array from ["compagnia", "guardia", "caccia", "sport", "pastorizia", "terapia", "lavoro", "slitta"]

Be accurate and specific to each breed. Use your expert knowledge of breed standards, temperament, and care requirements.

Here are the breeds:

${breedsContext}

Return ONLY the JSON array, no markdown, no explanation.`;
}

function formatBreedContext(breed) {
  const parts = [
    `Slug: ${breed.slug}`,
    `Name: ${breed.name_it} (${breed.name_en})`,
    `FCI Group ${breed.group_fci}: ${breed.group_name_it}`,
    `Size: ${breed.size_category}`,
    `Origin: ${breed.origin_country}`,
  ];
  if (breed.weight_min_kg && breed.weight_max_kg) {
    parts.push(`Weight: ${breed.weight_min_kg}-${breed.weight_max_kg} kg`);
  }
  if (breed.description_it) {
    parts.push(`Description: ${breed.description_it.slice(0, 200)}`);
  }
  return parts.join("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  const client = new Anthropic();

  // Load enriched data
  const dataPath = resolve(ROOT, "src/data/razze-enriched.json");
  const breeds = JSON.parse(readFileSync(dataPath, "utf8"));
  console.log(`\nLoaded ${breeds.length} breeds from razze-enriched.json`);

  // Load manual overrides
  const overridesPath = resolve(__dirname, "manual-overrides.json");
  let overrides = {};
  try {
    overrides = JSON.parse(readFileSync(overridesPath, "utf8"));
  } catch { /* no overrides file */ }

  // Filter breeds needing processing
  let toProcess = breeds;
  if (resume) {
    toProcess = breeds.filter((b) => !b.seeker_attributes);
    console.log(`Resume mode: ${toProcess.length} breeds need processing (${breeds.length - toProcess.length} already done)`);
  }

  if (toProcess.length === 0) {
    console.log("All breeds already have seeker_attributes. Nothing to do.");
    return;
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    batches.push(toProcess.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${toProcess.length} breeds in ${batches.length} batches of ${BATCH_SIZE}...\n`);

  let processed = 0;
  let failures = 0;

  // Build a slug->index map for the full breeds array
  const slugIndex = {};
  for (let i = 0; i < breeds.length; i++) {
    slugIndex[breeds[i].slug] = i;
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const batchContext = batch.map((b, i) => `--- Breed ${i + 1} ---\n${formatBreedContext(b)}`).join("\n\n");

    console.log(`Batch ${batchIdx + 1}/${batches.length}: ${batch.map((b) => b.name_en).join(", ")}`);

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          { role: "user", content: buildPrompt(batchContext) },
        ],
      });

      const text = response.content[0].text;

      // Parse JSON (handle potential markdown wrapping)
      let results;
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found in response");
        results = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error(`   Failed to parse response: ${parseErr.message}`);
        console.error(`   Raw response (first 500 chars): ${text.slice(0, 500)}`);
        failures += batch.length;
        continue;
      }

      // Match results to breeds and validate
      for (const result of results) {
        const slug = result.slug;
        if (!slug || slugIndex[slug] === undefined) {
          console.warn(`   ⚠️  Unknown slug in response: ${slug}`);
          continue;
        }

        // Remove slug from attributes (it's just for matching)
        const { slug: _slug, ...attrs } = result;

        // Apply manual overrides if present
        const override = overrides[slug];
        if (override?.seeker_attributes) {
          Object.assign(attrs, override.seeker_attributes);
        }

        const breed = breeds[slugIndex[slug]];
        const valid = validateAttributes(attrs, breed.name_it);

        if (valid || dryRun) {
          breed.seeker_attributes = attrs;
          breed.sources.seeker_attributes = "Claude AI (breed expert knowledge)";
          // Remove old quiz_attributes
          delete breed.quiz_attributes;
          delete breed.sources.quiz_attributes;
          processed++;
        } else {
          // Still write it but flag it
          breed.seeker_attributes = attrs;
          breed.sources.seeker_attributes = "Claude AI (breed expert knowledge) [needs review]";
          delete breed.quiz_attributes;
          delete breed.sources.quiz_attributes;
          processed++;
        }
      }

      if (dryRun) {
        console.log("\n--- DRY RUN RESULTS ---");
        for (const result of results) {
          console.log(JSON.stringify(result, null, 2));
        }
        console.log("\nDry run complete. No files written.");
        return;
      }

      // Write after each batch (in case of interruption)
      writeFileSync(dataPath, JSON.stringify(breeds, null, 2));
      console.log(`   ✅ ${results.length} breeds processed, file saved.\n`);

    } catch (err) {
      console.error(`   ❌ API error: ${err.message}`);
      failures += batch.length;
    }

    // Rate limiting delay between batches
    if (batchIdx < batches.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Final summary
  const withAttrs = breeds.filter((b) => b.seeker_attributes).length;
  const withoutQuiz = breeds.filter((b) => !b.quiz_attributes).length;

  console.log(`
Done!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total breeds:            ${breeds.length}
  Seeker attributes added: ${processed}
  Failures:                ${failures}
  Total with attributes:   ${withAttrs} / ${breeds.length}
  Old quiz_attributes:     ${breeds.length - withoutQuiz} remaining

Output: src/data/razze-enriched.json
`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
