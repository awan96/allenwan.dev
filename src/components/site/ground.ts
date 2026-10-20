// src/components/site/ground.ts
// The hero's ground as one repeating tile: tufts, the lit grass edge, the
// grass with its flecks, the ink line. The footer's strip and the 404's
// window both wear it, drawn with the same greens and the same hash the
// hero's grass uses, so it renders the same every time.
//
// The tile is an SVG at one unit per art pixel, used as a CSS background
// sized by --art-px (globals.css), so it steps with the rest of the site's
// pixel art instead of sitting at a fixed scale. It is one small file,
// /ground.svg (app/ground.svg/route.ts), fetched once and cached, rather
// than an 8 KB data URI written into every page that shows it.

import { PALETTE } from "@/components/pixel/siteSprites";
import { encodeSprite, spriteMarkup } from "@/components/pixel/spritePaths";
import { hash } from "./scene/hash";

/** Tile width in art pixels before the pattern repeats. */
export const GROUND_COLS = 160;
const TUFTS = 2;
const GRASS = 4;
/** Tufts, grass and the ink line. */
export const GROUND_ROWS = TUFTS + GRASS + 1;

/** The tile, one letter per art pixel: L the lit edge and its tufts, G the
    grass, D the grass's flecks, K the ink line. */
export function groundGrid(): string[] {
  const rows = Array.from({ length: GROUND_ROWS }, () => Array<string>(GROUND_COLS).fill("."));
  const top = TUFTS;
  rows[top].fill("L");
  for (let y = top + 1; y < top + GRASS; y++) rows[y].fill("G");
  rows[top + GRASS].fill("K");
  for (let x = 0; x < GROUND_COLS; x++) {
    const tuft = hash(x, 7.7);
    if (tuft > 0.78) rows[top - 1][x] = "L";
    if (tuft > 0.95) rows[top - 2][x] = "L";
    for (let y = top + 2; y < top + GRASS; y++) {
      if (hash(x, y * 1.3) > 0.86) rows[y][x] = "D";
    }
  }
  return rows.map((row) => row.join(""));
}

/** The tile's letters, in colour. */
export const GROUND_FILLS: Record<string, string> = { L: PALETTE.leafLight, G: PALETTE.leaf, D: PALETTE.leafDark, K: "#1a1a18" };

/** The tile as an SVG file: one path per colour (spritePaths.ts). */
export const GROUND_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${GROUND_COLS}" height="${GROUND_ROWS}" ` +
  `viewBox="0 0 ${GROUND_COLS} ${GROUND_ROWS}" shape-rendering="crispEdges">` +
  spriteMarkup(encodeSprite(groundGrid(), (ch) => (ch && GROUND_FILLS[ch]) || null)) +
  `</svg>`;

// A fingerprint of the tile (FNV-1a), so a changed tile is a new URL.
function fingerprint(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/** A CSS `url()` of the tile, ready for background-image. */
export const GROUND_TILE = `url("/ground.svg?v=${fingerprint(GROUND_SVG)}")`;
