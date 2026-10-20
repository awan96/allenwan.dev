// scripts/hero-day-svg.mjs
// The home-hero case study's 24-hour figure: the hero's sky across a day,
// one column per ten minutes, mixed through the engine's Bayer rule, with
// the sun and moon placed by altitudeAt. Every value comes from
// src/lib/sky.ts and the band colours in HeroScene.module.css, so after a
// change to the sky's timing or colours, run it again. Node 22.18+ (it
// imports sky.ts with type stripping). Usage, from the repo root:
//   node scripts/hero-day-svg.mjs [public/projects/home-hero/day.svg]
import { readFileSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "public/projects/home-hero/day.svg";

// Every tone's five band colours, light and dark.
const css = readFileSync("src/components/site/HeroScene.module.css", "utf8");
const darkAt = css.indexOf("@media (prefers-color-scheme: dark)");
const light = css.slice(0, darkAt), dark = css.slice(darkAt);
function tones(block) {
  const out = {};
  for (const tone of ["dawn", "day", "dusk", "night", "golden"]) {
    const re = new RegExp(`data-probe="${tone}"\\][^{]*\\{([^}]*)\\}`);
    const m = block.match(re);
    if (!m) throw new Error("no " + tone);
    out[tone] = [0, 1, 2, 3, 4].map((i) => m[1].match(new RegExp(`--sky-b${i}:\\s*(#[0-9a-f]{6})`))[1]);
  }
  return out;
}
const BANDS = { light: tones(light), dark: tones(dark) };
const sky = await import(new URL("../src/lib/sky.ts", import.meta.url).href);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; // scene/draw.ts's table (its @/ imports keep Node from loading it)

const W = 1200, X0 = 24, PER_H = 48;              // 24 h × 48 px = 1152 px
const CELL = 8, COLS = 144, ROWS_PER_BAND = 4, ROWS = 5 * ROWS_PER_BAND;
const SKY_TOP = 70, SKY_H = ROWS * CELL;          // 160 px of sky
const GROUND = SKY_TOP + SKY_H;                   // grass, then the ink line
const xh = (h) => X0 + h * PER_H;

function strip(scheme) {
  const runs = new Map();                         // colour -> path data
  const add = (color, x, y, w) => runs.set(color, (runs.get(color) ?? "") + `M${x} ${y}h${w}v${CELL}h-${w}z`);
  for (let r = 0; r < ROWS; r++) {
    const band = Math.floor(r / ROWS_PER_BAND);
    let run = null;
    for (let c = 0; c <= COLS; c++) {
      let color = null;
      if (c < COLS) {
        const h = (c + 0.5) * (24 / COLS);
        const { from, to, f } = sky.skyMixAt(h);
        const k = Math.round(f * 16);
        const tone = BAYER[(r & 3) * 4 + (c & 3)] < k ? to : from;
        color = BANDS[scheme][tone][band];
      }
      if (run && run.color === color) { run.n++; continue; }
      if (run) add(run.color, xh(0) + run.c * CELL, SKY_TOP + r * CELL, run.n * CELL);
      run = color && { color, c, n: 1 };
    }
  }
  return [...runs].map(([color, d]) => `<path fill="${color}" d="${d}"/>`).join("\n    ");
}

// The hours, all from sky.ts: each sky's rest, its time on its own (rest to
// the next blend, split where it crosses midnight), the golden peaks.
const { SKIES, SKY_STARTS, SKY_HOUR, BLEND_HOURS, BRIDGE, SUN, MOON, nextSky } = sky;
const fmt = (h) => `${h}:00`;
const soloOf = (s) => {
  const a = SKY_STARTS[s], b = a + sky.normalizeHour(SKY_STARTS[nextSky(s)] - BLEND_HOURS - a);
  return b <= 24 ? [[a, b]] : [[a, 24], [0, b - 24]];
};
const goldenAt = Object.keys(BRIDGE).map((s) => SKY_STARTS[s] - BLEND_HOURS / 2);
const scrollFrom = SKY_HOUR.day, scrollTo = SKY_HOUR[nextSky("day")], blendFrom = scrollTo - BLEND_HOURS;

// Altitude 0 sits near the sky's foot and 1 near its top, as in the scene.
const yAlt = (a) => GROUND - 14 - a * (SKY_H - 44);
function arc(kind) {
  const pts = [];
  const segs = [];
  for (let m = 0; m <= 24 * 60; m += 5) {
    const h = m / 60, a = sky.altitudeAt(h, kind);
    if (a >= 0) pts.push(`${xh(h).toFixed(1)},${yAlt(a).toFixed(1)}`);
    else if (pts.length) { segs.push(pts.splice(0)); }
  }
  if (pts.length) segs.push(pts);
  return segs.map((p) => `<polyline class="halo" points="${p.join(" ")}"/><polyline class="arc arc-${kind}" points="${p.join(" ")}"/>`).join("\n  ");
}
// The discs where each sky rests: dawn's sun just over the hills, day's at
// its highest, dusk's half behind the hills, night's moon near its highest.
const disc = (h, kind) => {
  const x = xh(h), y = yAlt(Math.max(0, sky.altitudeAt(h, kind)));
  return kind === "sun"
    ? `<circle class="sun" cx="${x}" cy="${y}" r="9"/>`
    : `<g><circle class="moon" cx="${x}" cy="${y}" r="9"/><circle class="bite" cx="${x + 5}" cy="${y - 3}" r="7.5"/></g>`;
};

const ticks = Array.from({ length: 25 }, (_, h) => `<line class="tick${h % 6 === 0 ? " major" : ""}" x1="${xh(h)}" y1="${GROUND + 24}" x2="${xh(h)}" y2="${GROUND + (h % 6 === 0 ? 36 : 31)}"/>`).join("");
const hourLabels = [0, 4, 8, 12, 16, 20, 24].map((h) => `<text class="small" x="${xh(h)}" y="${GROUND + 56}" text-anchor="${h === 0 ? "start" : h === 24 ? "end" : "middle"}">${h}:00</text>`).join("");
const skyLabels = SKIES.map((n) => {
  const [a, b] = soloOf(n).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))[0]; // the longer piece
  return `<text class="label" x="${xh((a + b) / 2)}" y="40" text-anchor="middle">${n}</text>`;
}).join("");
const solo = SKIES.flatMap(soloOf)
  .map(([a, b]) => `<line class="rule" x1="${xh(a) + 2}" y1="54" x2="${xh(b) - 2}" y2="54"/><line class="tick" x1="${xh(a) + 2}" y1="49" x2="${xh(a) + 2}" y2="59"/><line class="tick" x1="${xh(b) - 2}" y1="49" x2="${xh(b) - 2}" y2="59"/>`).join("");
const golden = goldenAt.map((h) => `<line class="pin" x1="${xh(h)}" y1="46" x2="${xh(h)}" y2="${SKY_TOP - 2}"/><text class="small" x="${xh(h)}" y="40" text-anchor="middle">golden</text>`).join("");
const rests = SKIES.map((s) => SKY_HOUR[s]).map((h) => `<polygon class="rest" points="${xh(h) - 7},${GROUND + 82} ${xh(h) + 7},${GROUND + 82} ${xh(h)},${GROUND + 70}"/>`).join("");
const scrollY = GROUND + 110;
const scroll = `<line class="rule" x1="${xh(scrollFrom)}" y1="${scrollY}" x2="${xh(scrollTo)}" y2="${scrollY}"/>
  <line class="tick" x1="${xh(scrollFrom)}" y1="${scrollY - 7}" x2="${xh(scrollFrom)}" y2="${scrollY + 7}"/>
  <line class="tick" x1="${xh(blendFrom)}" y1="${scrollY - 7}" x2="${xh(blendFrom)}" y2="${scrollY + 7}"/>
  <line class="tick" x1="${xh(scrollTo)}" y1="${scrollY - 7}" x2="${xh(scrollTo)}" y2="${scrollY + 7}"/>
  <text class="small" x="${xh(scrollFrom) - 14}" y="${scrollY + 5}" text-anchor="end">one scroll from day's rest</text>
  <text class="small" x="${xh((scrollFrom + blendFrom) / 2)}" y="${scrollY + 26}" text-anchor="middle">same sky</text>
  <text class="small" x="${xh((blendFrom + scrollTo) / 2)}" y="${scrollY + 26}" text-anchor="middle">blend</text>`;
const H = scrollY + 44;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">The hero's sky across 24 hours, one column per ten minutes. Dawn rests at ${fmt(SKY_HOUR.dawn)}, day at ${fmt(SKY_HOUR.day)}, dusk at ${fmt(SKY_HOUR.dusk)}, night at ${fmt(SKY_HOUR.night)}; each sky blends in over the two hours before it, and the blends into dawn and dusk pass through golden hour at ${goldenAt.map(fmt).join(" and ")}. The sun is up from ${fmt(SUN.rise)} to ${fmt(SUN.set)}, the moon from ${fmt(MOON.rise)} to ${fmt(MOON.set)}. One scroll from day's rest runs ${fmt(scrollFrom)} to ${fmt(scrollTo)} and blends from ${fmt(blendFrom)}.</title>
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
    .rule { stroke: var(--rule); stroke-width: 2; fill: none; }
    .tick { stroke: var(--rule); stroke-width: 2; }
    .tick.major { stroke-width: 3; }
    .pin { stroke: var(--muted); stroke-width: 2; stroke-dasharray: 3 4; }
    .rest { fill: var(--ink); }
    .halo { fill: none; stroke: rgba(26,26,24,0.45); stroke-width: 6; stroke-linejoin: round; stroke-linecap: round; }
    .arc { fill: none; stroke: #fff6e0; stroke-width: 2.5; stroke-linejoin: round; }
    .arc-moon { stroke-dasharray: 1 7; stroke-linecap: round; stroke-width: 3.5; }
    .sun { fill: #ffd08a; stroke: #1a1a18; stroke-width: 2; }
    .moon { fill: #f1ead2; stroke: #1a1a18; stroke-width: 2; }
    .bite { fill: #0f1624; }
    .grass { fill: #2a5c45; } .edge { fill: #3f7a5c; } .ink { fill: #1a1a18; }
  </style>
  <rect class="paper" x="0" y="0" width="${W}" height="${H}"/>
  <g class="light">
    ${strip("light")}
  </g>
  <g class="dark">
    ${strip("dark")}
  </g>
  <rect class="edge" x="${X0}" y="${GROUND}" width="${24 * PER_H}" height="4"/>
  <rect class="grass" x="${X0}" y="${GROUND + 4}" width="${24 * PER_H}" height="8"/>
  <rect class="ink" x="${X0}" y="${GROUND + 12}" width="${24 * PER_H}" height="4"/>
  ${arc("sun")}
  ${arc("moon")}
  ${disc(SKY_HOUR.dawn, "sun")}${disc(SKY_HOUR.day, "sun")}${disc(SKY_HOUR.dusk, "sun")}${disc(SKY_HOUR.night, "moon")}
  ${skyLabels}${solo}${golden}
  ${ticks}${hourLabels}
  ${rests}
  <polygon class="rest" points="${xh(0)},${GROUND + 82} ${xh(0) + 14},${GROUND + 82} ${xh(0) + 7},${GROUND + 70}"/>
  <text class="small" x="${xh(0) + 22}" y="${GROUND + 82}">resting hour</text>
  ${scroll}
</svg>
`;
writeFileSync(OUT, svg);
console.log(OUT, (svg.length / 1024).toFixed(1) + " KB", W + "x" + H);
