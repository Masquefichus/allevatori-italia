/**
 * translate-breeds.mjs
 *
 * Uses Claude API to translate breed names and generate Italian descriptions
 * for breeds in razze-enriched.json that are missing them.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-breeds.mjs
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-breeds.mjs --dry-run
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-breeds.mjs --resume
 *
 * Options:
 *   --dry-run   Process only the first batch and print results without writing
 *   --resume    Skip breeds that already have name_it != name_en AND description_it
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

// ─── Slugify (mirrors src/lib/utils.ts) ─────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateResult(result, breedName) {
  const errors = [];

  if (!result.name_it || typeof result.name_it !== "string" || result.name_it.trim().length === 0) {
    errors.push("name_it is empty or missing");
  }

  if (!result.description_it || typeof result.description_it !== "string") {
    errors.push("description_it is missing");
  } else if (result.description_it.length < 50) {
    errors.push(`description_it too short (${result.description_it.length} chars)`);
  }

  if (errors.length > 0) {
    console.warn(`   ⚠️  Validation warnings for ${breedName}: ${errors.join("; ")}`);
    return false;
  }
  return true;
}

// ─── Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt(breedsContext) {
  return `Sei un esperto cinofilo italiano. Per ogni razza sotto, fornisci il nome italiano e una descrizione in italiano.

REGOLE IMPORTANTI PER IL NOME:
- Usa il nome con cui la razza è effettivamente conosciuta in Italia
- Molte razze mantengono il nome internazionale anche in italiano (es. "Golden Retriever", "Bulldog", "Boxer", "Beagle", "Collie") — NON tradurre forzatamente questi nomi
- Altre razze hanno un nome italiano consolidato (es. "Pastore Tedesco" per "German Shepherd", "Levriero Afgano" per "Afghan Hound") — usa quello italiano
- In caso di dubbio, usa il nome più diffuso tra gli allevatori e cinofili italiani
- Parole come "Great", "Small", "Blue", "Black", "White", "Old", "Short", "Long", "Wire", "Smooth", "Flat", "Curly" vanno tradotte se fanno parte di un nome descrittivo (es. "Great Dane" → "Alano", "Old English Sheepdog" → "Bobtail")

REGOLE PER LA DESCRIZIONE:
- Scrivi 100-150 parole in italiano
- Tono enciclopedico e neutrale
- Includi: origine/storia, aspetto fisico, temperamento, utilizzo tipico
- Non iniziare con "Il/La [nome razza] è..." — varia l'incipit
- Non usare markdown o formattazione

FORMATO: Rispondi SOLO con un array JSON, un oggetto per razza, nello stesso ordine dell'input. Ogni oggetto deve avere:
- "slug": lo slug della razza (per il matching)
- "name_it": il nome italiano corretto
- "description_it": la descrizione in italiano (100-150 parole)

Razze da elaborare:

${breedsContext}

Rispondi SOLO con l'array JSON, senza markdown né spiegazioni.`;
}

function formatBreedContext(breed) {
  const parts = [
    `Slug: ${breed.slug}`,
    `Name EN: ${breed.name_en}`,
    `Current name IT: ${breed.name_it}`,
    `FCI Group ${breed.group_fci}: ${breed.group_name_it}`,
    `Size: ${breed.size_category}`,
    `Origin: ${breed.origin_country}`,
  ];
  if (breed.weight_min_kg && breed.weight_max_kg) {
    parts.push(`Weight: ${breed.weight_min_kg}-${breed.weight_max_kg} kg`);
  }
  if (breed.description_en) {
    parts.push(`Description EN: ${breed.description_en.slice(0, 300)}`);
  }
  if (breed.description_it) {
    parts.push(`Description IT (existing): ${breed.description_it.slice(0, 300)}`);
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

  // Determine which breeds need processing
  const needsName = breeds.filter((b) => b.name_it.toUpperCase() === b.name_en.toUpperCase());
  const needsDesc = breeds.filter((b) => !b.description_it);
  const needsWork = breeds.filter(
    (b) => b.name_it.toUpperCase() === b.name_en.toUpperCase() || !b.description_it
  );

  console.log(`Breeds needing Italian name: ${needsName.length}`);
  console.log(`Breeds needing Italian description: ${needsDesc.length}`);
  console.log(`Total breeds needing work: ${needsWork.length}`);

  let toProcess = needsWork;
  if (resume) {
    toProcess = breeds.filter((b) => {
      const hasItalianName = b.name_it.toUpperCase() !== b.name_en.toUpperCase();
      const hasItalianDesc = !!b.description_it;
      return !hasItalianName || !hasItalianDesc;
    });
    console.log(`Resume mode: ${toProcess.length} breeds still need processing`);
  }

  if (toProcess.length === 0) {
    console.log("All breeds already have Italian names and descriptions. Nothing to do.");
    return;
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    batches.push(toProcess.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `\nProcessing ${toProcess.length} breeds in ${batches.length} batches of ${BATCH_SIZE}...\n`
  );

  let processed = 0;
  let failures = 0;
  let slugChanges = [];

  // Build a slug->index map for the full breeds array
  const slugIndex = {};
  for (let i = 0; i < breeds.length; i++) {
    slugIndex[breeds[i].slug] = i;
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const batchContext = batch
      .map((b, i) => `--- Razza ${i + 1} ---\n${formatBreedContext(b)}`)
      .join("\n\n");

    console.log(
      `Batch ${batchIdx + 1}/${batches.length}: ${batch.map((b) => b.name_en).join(", ")}`
    );

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: buildPrompt(batchContext) }],
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

      // Match results to breeds and update
      for (const result of results) {
        const slug = result.slug;
        if (!slug || slugIndex[slug] === undefined) {
          console.warn(`   ⚠️  Unknown slug in response: ${slug}`);
          continue;
        }

        const breed = breeds[slugIndex[slug]];
        const valid = validateResult(result, breed.name_en);

        if (valid || dryRun) {
          const oldName = breed.name_it;
          const newName = result.name_it.trim();

          // Update name
          if (oldName.toUpperCase() === breed.name_en.toUpperCase() && newName !== oldName) {
            breed.name_it = newName;
            const newSlug = slugify(newName);
            if (newSlug !== breed.slug) {
              slugChanges.push({ old: breed.slug, new: newSlug, name: newName });
              // Update slug index
              delete slugIndex[breed.slug];
              breed.slug = newSlug;
              slugIndex[newSlug] = slugIndex[slug] ?? breeds.indexOf(breed);
            }
            console.log(`   📝 ${oldName} → ${newName}`);
          }

          // Update description
          if (!breed.description_it || breed.description_it === breed.description_en) {
            breed.description_it = result.description_it.trim();
            breed.sources.description_it = "Claude AI (traduzione italiana)";
          }

          processed++;
        } else {
          failures++;
        }
      }

      if (dryRun) {
        console.log("\n--- DRY RUN RESULTS ---");
        for (const result of results) {
          console.log(JSON.stringify(result, null, 2));
        }
        if (slugChanges.length > 0) {
          console.log("\n--- SLUG CHANGES ---");
          for (const sc of slugChanges) {
            console.log(`  ${sc.old} → ${sc.new} (${sc.name})`);
          }
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

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done! Processed: ${processed}, Failures: ${failures}`);
  if (slugChanges.length > 0) {
    console.log(`\n⚠️  ${slugChanges.length} slug(s) changed:`);
    for (const sc of slugChanges) {
      console.log(`  ${sc.old} → ${sc.new} (${sc.name})`);
    }
    console.log("\nCheck for hardcoded slug references in the codebase.");
  }
}

main().catch(console.error);
