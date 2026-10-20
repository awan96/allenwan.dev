// scripts/hero-dither-svg.mjs
// The home-hero case study's dither figure: the 4×4 Bayer tile with its
// numbers, then the same steps of a dusk-to-night blend in Bayer order and
// in reading order, so the even texture and the stripes sit side by side.
// The two colours are the skies' middle bands from HeroScene.module.css
// (light and dark), and the tile is scene/draw.ts's, so after a change to
// either, run it again. Usage, from the repo root:
//   node scripts/hero-dither-svg.mjs [public/projects/home-hero/dither.svg]
import { readFileSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "public/projects/home-hero/dither.svg";

// Each scheme's middle band (b2) for dusk and night.
const css = readFileSync("src/components/site/HeroScene.module.css", "utf8");
const darkAt = css.indexOf("@media (prefers-color-scheme: dark)");
function band(block, tone, i) {
  const m = block.match(new RegExp(`data-probe="${tone}"\\][^{]*\\{([^}]*)\\}`));
  return m[1].match(new RegExp(`--sky-b${i}:\\s*(#[0-9a-f]{6})`))[1];
}
const COLOURS = {
  light: { from: band(css.slice(0, darkAt), "dusk", 2), to: band(css.slice(0, darkAt), "night", 2) },
  dark: { from: band(css.slice(darkAt), "dusk", 2), to: band(css.slice(darkAt), "night", 2) },
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; // scene/draw.ts's table

const W = 1200;
const STEPS = [2, 4, 8, 12, 14, 16];     // of 16
const PX = 7, PATCH = 16;               // a 16×16-pixel patch, 7 px per pixel
const PW = PATCH * PX;                  // 112
const GAP = 22;
const KEY_CELL = 48, KEY_X = 24, KEY_Y = 78;
const ROWS_X = 330;
const ROW1_Y = 78, ROW2_Y = ROW1_Y + PW + 112;
const H = ROW2_Y + PW + 70;

/** The flipped pixels of a 16×16 patch at step k, as one path. */
function patch(x0, y0, k, order) {
  let d = "";
  for (let y = 0; y < PATCH; y++) {
    let run = 0;
    for (let x = 0; x <= PATCH; x++) {
      const i = (y & 3) * 4 + (x & 3);
      const on = x < PATCH && (order === "bayer" ? BAYER[i] : i) < k;
      if (on) run++;
      else if (run) { d += `M${x0 + (x - run) * PX} ${y0 + y * PX}h${run * PX}v${PX}h-${run * PX}z`; run = 0; }
    }
  }
  return d;
}

function scheme(name) {
  const c = COLOURS[name];
  const parts = [];
  // The key: the tile at 8 of 16, numbered.
  for (let i = 0; i < 16; i++) {
    const x = KEY_X + (i & 3) * KEY_CELL, y = KEY_Y + (i >> 2) * KEY_CELL;
    parts.push(`<rect x="${x}" y="${y}" width="${KEY_CELL}" height="${KEY_CELL}" fill="${BAYER[i] < 8 ? c.to : c.from}"/>`);
    parts.push(`<text class="num" x="${x + KEY_CELL / 2}" y="${y + KEY_CELL / 2 + 7}" text-anchor="middle">${BAYER[i]}</text>`);
  }
  // The two rows of patches.
  for (const [row, order, y0] of [[1, "bayer", ROW1_Y], [2, "reading", ROW2_Y]]) {
    STEPS.forEach((k, j) => {
      const x0 = ROWS_X + j * (PW + GAP);
      parts.push(`<rect x="${x0}" y="${y0}" width="${PW}" height="${PW}" fill="${c.from}"/>`);
      const d = patch(x0, y0, k, order);
      if (d) parts.push(`<path fill="${c.to}" d="${d}"/>`);
    });
  }
  return parts.join("\n    ");
}

const stepLabels = (y) => STEPS.map((k, j) =>
  `<text class="small" x="${ROWS_X + j * (PW + GAP) + PW / 2}" y="${y}" text-anchor="middle">${k} of 16</text>`).join("");
const keyGrid = Array.from({ length: 5 }, (_, i) =>
  `<line class="grid" x1="${KEY_X + i * KEY_CELL}" y1="${KEY_Y}" x2="${KEY_X + i * KEY_CELL}" y2="${KEY_Y + 4 * KEY_CELL}"/>` +
  `<line class="grid" x1="${KEY_X}" y1="${KEY_Y + i * KEY_CELL}" x2="${KEY_X + 4 * KEY_CELL}" y2="${KEY_Y + i * KEY_CELL}"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">The 4×4 Bayer tile, numbered 0 to 15, with the eight lowest numbers already turned to night. Beside it, six steps of a dusk-to-night blend, 2, 4, 8, 12, 14, and 16 pixels of every 16: in Bayer order each step is an even texture, and in reading order the same steps come in as stripes.</title>
  <style>
    :root { --ink: #1a1a18; --paper: #f6efdd; --muted: #62625c; --rule: #1a1a18; }
    .dark { display: none; }
    @media (prefers-color-scheme: dark) {
      :root { --ink: #eeece6; --paper: #111110; --muted: #9c9c94; --rule: rgba(238,236,230,0.55); }
      .light { display: none; }
      .dark { display: inline; }
    }
    .paper { fill: var(--paper); }
    .label { font-family: "Sometype Mono", ui-monospace, Menlo, monospace; font-size: 20px; letter-spacing: 0.06em; text-transform: uppercase; fill: var(--ink); }
    .small { font-family: "Sometype Mono", ui-monospace, Menlo, monospace; font-size: 17px; letter-spacing: 0.02em; fill: var(--muted); }
    .num { font-family: "Sometype Mono", ui-monospace, Menlo, monospace; font-size: 20px; fill: #f6efdd; }
    .grid { stroke: var(--paper); stroke-width: 2; }
    .frame { fill: none; stroke: var(--rule); stroke-width: 2; }
  </style>
  <rect class="paper" x="0" y="0" width="${W}" height="${H}"/>
  <g class="light">
    ${scheme("light")}
  </g>
  <g class="dark">
    ${scheme("dark")}
  </g>
  ${keyGrid}
  <rect class="frame" x="${KEY_X}" y="${KEY_Y}" width="${4 * KEY_CELL}" height="${4 * KEY_CELL}"/>
  <text class="label" x="${KEY_X}" y="${KEY_Y - 24}">The tile</text>
  <text class="small" x="${KEY_X}" y="${KEY_Y + 4 * KEY_CELL + 34}">A pixel turns once the</text>
  <text class="small" x="${KEY_X}" y="${KEY_Y + 4 * KEY_CELL + 58}">step passes its number.</text>
  <text class="small" x="${KEY_X}" y="${KEY_Y + 4 * KEY_CELL + 82}">Shown at 8 of 16.</text>
  <text class="label" x="${ROWS_X}" y="${ROW1_Y - 24}">In Bayer order</text>
  ${stepLabels(ROW1_Y + PW + 30)}
  <text class="label" x="${ROWS_X}" y="${ROW2_Y - 24}">In reading order</text>
  ${stepLabels(ROW2_Y + PW + 30)}
</svg>
`;
writeFileSync(OUT, svg);
console.log(OUT, (svg.length / 1024).toFixed(1) + " KB", W + "x" + H);
