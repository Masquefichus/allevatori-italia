#!/usr/bin/env node
// Fetches all FCI breed pages to determine which breeds require working trials.
// Each page contains either:
//   "Subject to a working trial" → is_working_breed = true
//   "Not subject to a working trial" → is_working_breed = false
//
// Usage: node scripts/fetch-working-breeds.mjs
// Output: prints JSON list of { fci_id, name_en, is_working_breed }

import { readFileSync } from "fs";

// Parse razze.ts to extract breed entries
const src = readFileSync("src/data/razze.ts", "utf-8");
const breeds = [];
for (const line of src.split("\n")) {
  const m = line.match(/fci_id:\s*(\d+).*?name_en:\s*"([^"]+)".*?fci_url:\s*"([^"]+)"/);
  if (m) breeds.push({ fci_id: parseInt(m[1]), name_en: m[2], fci_url: m[3] });
}

console.log(`Found ${breeds.length} breeds. Fetching FCI pages...\n`);

const workingBreeds = [];
const errors = [];

for (let i = 0; i < breeds.length; i++) {
  const breed = breeds[i];
  try {
    const res = await fetch(breed.fci_url);
    if (!res.ok) {
      errors.push({ fci_id: breed.fci_id, name_en: breed.name_en, status: res.status });
      process.stdout.write(`✗`);
      continue;
    }
    const html = await res.text();
    const isWorking = html.includes("Subject to a working trial") && !html.includes("Not subject to a working trial");
    if (isWorking) {
      workingBreeds.push({ fci_id: breed.fci_id, name_en: breed.name_en });
      process.stdout.write(`W`);
    } else {
      process.stdout.write(`.`);
    }
  } catch (err) {
    errors.push({ fci_id: breed.fci_id, name_en: breed.name_en, error: err.message });
    process.stdout.write(`✗`);
  }
  // Rate limit: 100ms between requests
  await new Promise((r) => setTimeout(r, 100));
  // Progress every 50
  if ((i + 1) % 50 === 0) process.stdout.write(` [${i + 1}/${breeds.length}]\n`);
}

console.log(`\n\n=== RESULTS ===`);
console.log(`Total breeds: ${breeds.length}`);
console.log(`Working breeds: ${workingBreeds.length}`);
console.log(`Errors: ${errors.length}`);

console.log(`\n=== WORKING BREEDS (fci_ids) ===`);
const ids = workingBreeds.map((b) => b.fci_id).sort((a, b) => a - b);
console.log(JSON.stringify(ids));

console.log(`\n=== WORKING BREEDS (details) ===`);
for (const b of workingBreeds.sort((a, b) => a.fci_id - b.fci_id)) {
  console.log(`  ${b.fci_id}: ${b.name_en}`);
}

if (errors.length > 0) {
  console.log(`\n=== ERRORS ===`);
  for (const e of errors) console.log(`  ${e.fci_id}: ${e.name_en} — ${e.status || e.error}`);
}

// Output SQL UPDATE statement
console.log(`\n=== SQL UPDATE ===`);
console.log(`UPDATE breeds SET is_working_breed = true WHERE fci_id IN (${ids.join(", ")});`);
