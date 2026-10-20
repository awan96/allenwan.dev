// src/components/project/stageDirt.ts
// The stage's pixel dirt: a tile of sparse specks, one art pixel each, placed
// by the scene's hash the way the hero's soil places its pebbles, in tints of
// the stage's own dark. Built once, at build time, and drawn as an inline SVG
// pattern (HearthStage.tsx), not a background image. Banked on 2026-10-06:
// the stage keeps the paper grain for now, and STAGE_WALL in HearthStage.tsx
// switches it to this.

import { encodeSprite, type SpritePath } from "@/components/pixel/spritePaths";
import { hash } from "@/components/site/scene/hash";

/** Tile size in art pixels before the specks repeat. */
export const DIRT_TILE = 64;

// Translucent, so the hearth's glow lights the specks with the wall behind
// them: d a shadowed speck, D a deeper one, l a faint lit one. On the bare
// wall that is about 2.4, 3.7 and 3.3 points of lightness (L*) off it, a
// quarter under the first cut's, at Allen's word (2026-10-06).
const FILLS: Record<string, string> = {
  d: "rgba(10, 8, 16, 0.18)",
  D: "rgba(10, 8, 16, 0.28)",
  l: "rgba(246, 239, 221, 0.035)",
};

// About 3% of the wall's pixels, as Allen asked: 1.7% shadowed, 0.3% deeper,
// 1.0% lit (measured on the tile: 3.05% in all).
function dirtGrid(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < DIRT_TILE; y++) {
    let row = "";
    for (let x = 0; x < DIRT_TILE; x++) {
      const h = hash(x * 2.3 + 11, y * 1.9 + 7);
      row += h < 0.019 ? "d" : h < 0.0235 ? "D" : h > 0.9905 ? "l" : ".";
    }
    rows.push(row);
  }
  return rows;
}

export const DIRT_PATHS: SpritePath[] = encodeSprite(dirtGrid(), (ch) => (ch && FILLS[ch]) || null);
