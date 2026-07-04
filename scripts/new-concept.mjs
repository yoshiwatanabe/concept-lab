#!/usr/bin/env node
// Scaffold a new concept page from the template.
// Usage: node scripts/new-concept.mjs <domain> <concept-id> "<title_ja>" "<title_en>"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAINS = ["math", "stats", "ml", "physics", "electricity", "language"];
const [domain, id, titleJa, titleEn] = process.argv.slice(2);

if (!domain || !id || !titleJa || !titleEn) {
  console.error('Usage: node scripts/new-concept.mjs <domain> <concept-id> "<title_ja>" "<title_en>"');
  process.exit(1);
}
if (!DOMAINS.includes(domain)) {
  console.error(`Unknown domain "${domain}". Valid: ${DOMAINS.join(", ")}`);
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error(`concept-id must be kebab-case ascii, got "${id}"`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "src", "content", "concepts", domain, `${id}.mdx`);
if (existsSync(target)) {
  console.error(`Already exists: ${target}`);
  process.exit(1);
}

const template = readFileSync(join(root, "ops", "concept-template.mdx"), "utf8");
const content = template
  .replace("__TITLE_JA__", titleJa)
  .replace("__TITLE_EN__", titleEn)
  .replace("__DOMAIN__", domain);

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, content);
console.log(`Created ${target}`);
