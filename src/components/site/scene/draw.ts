// src/components/site/scene/draw.ts
// Drawing for the hero diorama, one scene pixel per canvas pixel. The
// engine calls these into small offscreen canvases and scales the result
// up by a whole number, so nothing here knows about CSS or device pixels.

import { colorForChar, type RoleMap } from "@/components/pixel/roles";
import { GRASS, STAR, FIREFLY, GLINT } from "./palettes";
import { GROUND, TREE_W, type SceneLayout } from "./layout";
import { hash } from "./hash";

export { hash };

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, color: string, x: number, y: number, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** A one-pixel ring around a sprite's silhouette, four-connected so its
    corners stay round. Drawn before the sprite. */
export function drawOutline(ctx: Ctx, grid: string[], ox: number, oy: number, color: string) {
  const on = (x: number, y: number) => y >= 0 && y < grid.length && x >= 0 && x < grid[y].length && grid[y][x] !== ".";
  ctx.fillStyle = color;
  for (let y = -1; y <= grid.length; y++) {
    for (let x = -1; x <= grid[0].length; x++) {
      if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

/** Any grid sprite, merging same-colour runs the way SpriteSvg does. */
export function drawSprite(
  ctx: Ctx, grid: string[], roles: RoleMap, palette: Record<string, string>, ox: number, oy: number,
) {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    let x = 0;
    while (x < row.length) {
      const fill = colorForChar(row[x], roles, palette);
      if (!fill) { x++; continue; }
      let w = 1;
      while (x + w < row.length && colorForChar(row[x + w], roles, palette) === fill) w++;
      px(ctx, fill, ox + x, oy + y, w);
      x += w;
    }
  }
}

// ---- Sky ----

/** Where each band ends, as a share of the sky's height: the pre-mount
    gradient in HeroScene.module.css, and the canvas's fallback when the
    words leave no open sky for the seams. */
export const BAND_STOPS = [0.3, 0.55, 0.74, 0.88];

/** The rows where the bands meet, clear of the words. A seam is a
    four-row checker, and behind a line of text it reads as a zipper, so
    the four seams share out the open sky above and below the text block,
    most to whichever has the most room, and the words sit on one flat
    band. Rows grow downward; `text` is the hero text's box. */
export function bandEdges(l: Pick<SceneLayout, "horizon" | "text">): number[] {
  const zones = [
    { a: 4, b: l.text.y0 - 4, n: 0 },
    { a: l.text.y1 + 4, b: l.horizon - 3, n: 0 },
  ];
  // A zone takes one seam at 6 rows of room, and one more per 5 rows.
  const cap = (z: { a: number; b: number }) => (z.b - z.a < 6 ? 0 : 1 + Math.floor((z.b - z.a - 6) / 5));
  for (let k = 0; k < BAND_STOPS.length; k++) {
    const open = zones.filter((z) => z.n < cap(z));
    if (!open.length) return BAND_STOPS.map((s) => Math.round(l.horizon * s));
    open.sort((p, q) => (q.b - q.a) / (q.n + 1) - (p.b - p.a) / (p.n + 1))[0].n++;
  }
  return zones.flatMap((z) => Array.from({ length: z.n }, (_, i) => Math.round(z.a + ((z.b - z.a) * (i + 0.5)) / z.n)));
}

// 4×4 Bayer thresholds: an ordered dither reads as a soft ramp, where
// aligned patterns read as a row of battlements.
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Flat bands, each seam a four-row ordered-dither ramp: the pixel-art
    gradient. `seams` comes from bandEdges(). If a seam still has to cross
    the words (a sky with no room), the checker stops at the text box and
    only the flat step shows there. */
export function drawSky(ctx: Ctx, W: number, seams: number[], bands: string[], text: SceneLayout["text"]) {
  // The last band runs to the layer's foot; the ground is drawn over it.
  const edges = [0, ...seams, ctx.canvas.height];
  for (let k = 0; k < bands.length; k++) px(ctx, bands[k], 0, edges[k], W, edges[k + 1] - edges[k]);
  const behindWords = (x: number, y: number) =>
    x >= text.x0 - 2 && x <= text.x1 + 2 && y >= text.y0 - 2 && y <= text.y1 + 2;
  for (let k = 1; k < bands.length; k++) {
    const e = edges[k];
    for (let y = e - 2; y < e + 2; y++) {
      const mix = (y - (e - 2) + 0.5) / 4; // share of the lower band on this row
      for (let x = 0; x < W; x++) {
        const lower = mix > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        if (lower !== y >= e && !behindWords(x, y)) px(ctx, bands[lower ? k : k - 1], x, y);
      }
    }
  }
}

type SunColors = { kind: "sun" | "moon"; core: string; rim: string; halo: string };

export function drawSun(ctx: Ctx, cx: number, cy: number, c: SunColors) {
  const R = 5.5;
  for (let dy = -9; dy <= 9; dy++) {
    for (let dx = -9; dx <= 9; dx++) {
      const d = Math.hypot(dx, dy);
      const x = cx + dx;
      const y = cy + dy;
      if (c.kind === "moon") {
        // A waxing crescent: the disc less a disc nudged up and right, rimmed
        // on both edges so the thin horn still reads.
        const b = Math.hypot(dx - 3.5, dy + 1.5);
        const bite = b <= R - 0.6;
        if (d <= R && !bite) px(ctx, d > R - 1.2 || b <= R + 0.4 ? c.rim : c.core, x, y);
        else if (d > R && d <= R + 2.5 && !bite && (dx + dy) % 2 === 0) px(ctx, c.halo, x, y);
      } else if (d <= R - 1.3) px(ctx, c.core, x, y);
      else if (d <= R) px(ctx, c.rim, x, y);
      else if (d <= R + 2.6 && (dx + dy) % 2 === 0) px(ctx, c.halo, x, y);
    }
  }
}

// ---- Stars, clouds, fireflies (the moving parts) ----

/** `appear`: the share of stars (0..1) the darkness must call for before this one shows. */
export type Star = { x: number; y: number; big: boolean; phase: number; rate: number; appear: number };

export function makeStars(l: SceneLayout, amount: "few" | "many"): Star[] {
  const reach = amount === "few" ? 0.34 : 0.8;
  const n = Math.round((l.W * l.horizon * reach) / (amount === "few" ? 320 : 190));
  // Never behind the words: a star on a letter reads as a stray mark.
  const t = l.text;
  const clear = (x: number, y: number) => x < t.x0 - 2 || x > t.x1 + 2 || y < t.y0 - 2 || y > t.y1 + 2;
  return Array.from({ length: n }, (_, i) => {
    const y = 1 + Math.floor(hash(i, 2.3) * l.horizon * reach);
    return {
      x: Math.floor(hash(i, 1.7) * l.W),
      y,
      big: hash(i, 3.1) > 0.94,
      phase: hash(i, 4.9) * Math.PI * 2,
      rate: 0.7 + hash(i, 5.3) * 1.8,
      appear: 0.6 * hash(i, 6.1) + 0.4 * (y / (l.horizon * reach)),
    };
  }).filter((s) => clear(s.x, s.y));
}

export function drawStars(ctx: Ctx, stars: Star[], t: number, still: boolean, share: number) {
  for (const s of stars) {
    if (s.appear >= share) continue;
    const tw = still ? 1 : Math.sin(t * s.rate + s.phase);
    if (tw < -0.55) continue;
    const c = tw > 0.25 ? STAR.bright : STAR.dim;
    px(ctx, c, s.x, s.y);
    if (s.big && tw > 0.25) {
      px(ctx, STAR.dim, s.x - 1, s.y);
      px(ctx, STAR.dim, s.x + 1, s.y);
      px(ctx, STAR.dim, s.x, s.y - 1);
      px(ctx, STAR.dim, s.x, s.y + 1);
    }
  }
}

// A body, B the belly (a shade on a light sky, a lit underside at dusk).
const CLOUD_SHAPES = [
  [
    ".......AAAA...........",
    "....AAAAAAAA..AAA.....",
    "..AAAAAAAAAAAAAAAAA...",
    ".AAAAAAAAAAAAAAAAAAAA.",
    "AAAAAAAAAAAAAAAAAAAAAA",
    ".BBBBBBBBBBBBBBBBBBBB.",
  ],
  [
    "....AAAA......",
    "..AAAAAAAAA...",
    ".AAAAAAAAAAAA.",
    "AAAAAAAAAAAAAA",
    ".BBBBBBBBBBBB.",
  ],
  [
    "............AAAAA.............",
    ".....AAAA..AAAAAAAA...........",
    "...AAAAAAAAAAAAAAAAAAAA.......",
    "..AAAAAAAAAAAAAAAAAAAAAAAAA...",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    ".BBBBBBBBBBBBBBBBBBBBBBBBBBBB.",
  ],
];

/** A cloud is baked once into its own small canvas, so a frame moves it
    with one drawImage instead of a hundred fillRects. */
export type Cloud = { img: HTMLCanvasElement; x0: number; y: number; speed: number };

function bakeCloud(shape: string[], c: { body: string; belly: string }): HTMLCanvasElement {
  const img = document.createElement("canvas");
  img.width = shape[0].length;
  img.height = shape.length;
  const ctx = img.getContext("2d")!;
  drawSprite(ctx, shape, { A: "body", B: "belly" }, c, 0, 0);
  return img;
}

export function makeClouds(l: SceneLayout, c: { body: string; belly: string }): Cloud[] {
  // Clouds drift where the words aren't: above the headline on desktop,
  // and through the gap between the text and the tree on phones. A tall
  // cloud is 6 rows.
  const t = l.text;
  let lo = 3;
  let hi = t.y0 - 8;
  if (l.stacked) {
    lo = t.y1 + 3;
    hi = l.tree.y - 7;
  } else if (hi - lo < 6) {
    hi = Math.round(l.horizon * 0.34); // a short window: let them pass behind
  }
  if (hi < lo) return [];
  const n = Math.max(2, Math.round(l.W / 85));
  const baked = CLOUD_SHAPES.map((shape) => bakeCloud(shape, c));
  // Heights step by the golden ratio (plus a little noise), so neighbours
  // never share a row and three clouds don't read as a tiled strip.
  return Array.from({ length: n }, (_, i) => ({
    img: baked[(i + 2) % baked.length],
    x0: Math.floor(((i + 0.1 + hash(i, 8.1) * 0.8) / n) * (l.W + 30)),
    y: lo + Math.round(((i * 0.618 + hash(i, 9.2) * 0.3) % 1) * (hi - lo)),
    speed: 0.45 + hash(i, 6.6) * 0.5, // scene px per second
  }));
}

export function drawClouds(ctx: Ctx, clouds: Cloud[], W: number, t: number) {
  for (const cl of clouds) {
    const w = cl.img.width;
    const span = W + w + 12;
    const x = Math.floor((((cl.x0 + t * cl.speed) % span) + span) % span) - w;
    ctx.drawImage(cl.img, x, cl.y);
  }
}

export type Fly = { x: number; y: number; phase: number };

export function makeFlies(l: SceneLayout): Fly[] {
  return Array.from({ length: 8 }, (_, i) => ({
    x: l.tree.cx + Math.round((hash(i, 4.4) - 0.5) * (TREE_W + 34)),
    y: l.horizon - 3 - Math.floor(hash(i, 5.5) * 24),
    phase: hash(i, 6.6) * Math.PI * 2,
  }));
}

export function drawFlies(ctx: Ctx, flies: Fly[], t: number, still: boolean) {
  flies.forEach((f, i) => {
    const on = still ? i % 2 === 0 : Math.sin(t * 1.7 + f.phase) > 0.15;
    if (!on) return;
    const x = Math.round(f.x + (still ? 0 : Math.sin(t * 0.55 + f.phase) * 4));
    const y = Math.round(f.y + (still ? 0 : Math.cos(t * 0.4 + f.phase * 1.3) * 3));
    px(ctx, FIREFLY.glow, x - 1, y);
    px(ctx, FIREFLY.glow, x + 1, y);
    px(ctx, FIREFLY.glow, x, y - 1);
    px(ctx, FIREFLY.glow, x, y + 1);
    px(ctx, FIREFLY.core, x, y);
  });
}

// ---- Land ----

export function drawHills(ctx: Ctx, l: SceneLayout, far: string, near: string) {
  for (let x = 0; x < l.W; x++) {
    const hf = Math.round(7 + 2.6 * Math.sin(x / 21 + 1.3) + 1.8 * Math.sin(x / 9 + 0.4) + 0.8 * Math.sin(x / 4.3));
    px(ctx, far, x, l.horizon - hf, 1, hf + 1);
    const hn = Math.round(3 + 1.8 * Math.sin(x / 15 + 2) + 1 * Math.sin(x / 6.1 + 1));
    if (hn > 0) px(ctx, near, x, l.horizon - hn, 1, hn + 1);
  }
}

/** Grass from the (knolled) surface down to the ink line, with tufts on top. */
export function drawGrass(ctx: Ctx, l: SceneLayout, flowers: boolean) {
  const bottom = l.horizon + GROUND.grass; // the ink line's row
  for (let x = 0; x < l.W; x++) {
    const top = l.surface[x];
    px(ctx, GRASS.body, x, top, 1, bottom - top);
    px(ctx, GRASS.edge, x, top);
    for (let y = top + 2; y < bottom; y++) if (hash(x, y * 1.3) > 0.86) px(ctx, GRASS.fleck, x, y);
    const tuft = hash(x, 7.7);
    if (tuft > 0.78) px(ctx, GRASS.edge, x, top - 1);
    if (tuft > 0.95) px(ctx, GRASS.edge, x, top - 2);
    if (flowers && hash(x, 13.1) > 0.975) px(ctx, GRASS.flowers[x % 2], x, top - 1);
  }
}

/** A few blades in front of the roots, so the tree stands in the grass. */
export function drawRootTufts(ctx: Ctx, l: SceneLayout) {
  for (const dx of [-7, -6, 5, 7]) {
    const x = l.tree.cx + dx;
    if (x >= 0 && x < l.W) px(ctx, GRASS.edge, x, l.surface[x] - 1);
  }
}

/** The ink line and the soil: the diorama's base, the page's own ground. */
export function drawSoil(ctx: Ctx, l: SceneLayout, soil: { base: string; light: string; dark: string }) {
  const ink = l.horizon + GROUND.grass;
  px(ctx, GRASS.ink, 0, ink, l.W);
  px(ctx, soil.base, 0, ink + 1, l.W, l.H - ink - 1);
  for (let y = ink + 2; y < l.H; y++) {
    for (let x = 0; x < l.W; x++) {
      const h = hash(x * 1.7, y * 3.1);
      if (h > 0.972) px(ctx, soil.light, x, y, h > 0.99 ? 2 : 1);
      else if (h < 0.018) px(ctx, soil.dark, x, y);
    }
  }
}

/** The apple's glint: a four-point spark blinks at its shoulder. `phase`
    runs 0..1 over the glint. */
export function drawSpark(ctx: Ctx, x: number, y: number, phase: number) {
  px(ctx, GLINT, x, y);
  if (phase > 0.25 && phase < 0.75) {
    px(ctx, GLINT, x - 1, y);
    px(ctx, GLINT, x + 1, y);
    px(ctx, GLINT, x, y - 1);
    px(ctx, GLINT, x, y + 1);
  }
}
