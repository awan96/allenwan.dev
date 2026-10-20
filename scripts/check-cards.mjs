// scripts/check-cards.mjs
// Compile-checks case-study MDX the way the site does (gray-matter, then
// next-mdx-remote/serialize with its JS-expression guard) and checks the
// frontmatter and components a draft card must have before it moves into
// content/projects/. Written for the day-job drafts (docs/WORK_CARDS.md):
// a finished card with real screenshots fails only the no-src rule.
// Usage, from the repo root: node scripts/check-cards.mjs content/drafts/*.mdx
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(process.cwd() + "/package.json");
const matter = require("gray-matter");
const { serialize } = require("next-mdx-remote/serialize");

const KNOWN = new Set(["Figure", "Gallery", "Callout", "Stats", "Stat", "GridAnatomy", "SpriteShowcase", "Sprite", "Stamp"]);
const CALLOUT_KINDS = new Set(["decision", "tradeoff", "lesson"]);

let failed = 0;
for (const file of process.argv.slice(2)) {
  const raw = fs.readFileSync(file, "utf8");
  const problems = [];
  let data, content;
  try {
    ({ data, content } = matter(raw));
  } catch (e) {
    console.log(`FAIL ${file}: frontmatter: ${e.message}`);
    failed++;
    continue;
  }
  for (const k of ["title", "summary", "role", "year", "stack", "links", "icon", "featured", "order", "filler"]) {
    if (!(k in data)) problems.push(`frontmatter missing ${k}`);
  }
  if (typeof data.year !== "string") problems.push(`year is ${typeof data.year}, not a string`);
  if (!Array.isArray(data.stack) || data.stack.length < 3 || data.stack.length > 5) problems.push(`stack has ${data.stack?.length} items`);
  if (data.summary && data.summary.length > 200) problems.push(`summary is ${data.summary.length} chars`);
  if (data.filler !== false) problems.push(`filler is ${data.filler}`);
  if (data.icon && !/^icon_[a-z_]+$/.test(data.icon)) problems.push(`icon ${data.icon}`);

  const tags = [...content.matchAll(/<([A-Z][A-Za-z]*)\b/g)].map((m) => m[1]);
  for (const t of new Set(tags)) if (!KNOWN.has(t)) problems.push(`unknown component <${t}>`);
  for (const m of content.matchAll(/<Callout\b[^>]*kind="([^"]*)"/g)) if (!CALLOUT_KINDS.has(m[1])) problems.push(`Callout kind "${m[1]}"`);
  for (const m of content.matchAll(/<Figure\b[^>]*>/g)) {
    if (/\bsrc=/.test(m[0])) problems.push(`Figure has src: ${m[0].slice(0, 60)}`);
    if (!/\balt=/.test(m[0])) problems.push(`Figure without alt: ${m[0].slice(0, 60)}`);
  }
  if (/\{[^}]*\}/.test(content.replace(/```[\s\S]*?```/g, ""))) problems.push("braces in body (JSX expressions are stripped by the loader)");
  for (const m of content.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const ok = ["/game", "/projects/to-arms-squire", "/projects/sprite-editor", "/about", "/contact", "/projects"];
    if (!ok.includes(m[1])) problems.push(`link to ${m[1]}`);
  }

  try {
    await serialize(content, {}, true);
  } catch (e) {
    problems.push(`MDX compile: ${e.message.split("\n")[0]}`);
  }

  const words = content
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const status = problems.length ? "FAIL" : "ok  ";
  if (problems.length) failed++;
  console.log(`${status} ${file.split("/").pop()}  words=${words}  summary=${data.summary?.length}ch  year=${data.year}  role="${data.role}"  icon=${data.icon}  order=${data.order}`);
  for (const p of problems) console.log(`     - ${p}`);
}
process.exit(failed ? 1 : 0);
