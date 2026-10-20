// scripts/to-webp.mjs
// A screenshot into the case studies' format: lossless WebP, the pixels
// untouched. Uses the sharp that Next.js brings along, so nothing to
// install. Usage, from the repo root:
//   node scripts/to-webp.mjs capture.png public/projects/<slug>/<name>.webp
// With one argument, writes <name>.webp beside the input.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const [input, output = input.replace(/\.[a-z]+$/i, ".webp")] = process.argv.slice(2);
if (!input) {
  console.error("usage: node scripts/to-webp.mjs <in.png|jpg> [out.webp]");
  process.exit(1);
}
const image = sharp(input);
const { width, height } = await image.metadata();
const info = await image.webp({ lossless: true, effort: 6 }).toFile(output);
console.log(`${output}  ${width}×${height}  ${(info.size / 1024).toFixed(0)} KB`);
