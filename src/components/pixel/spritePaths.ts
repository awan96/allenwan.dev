// src/components/pixel/spritePaths.ts
// A sprite as a few shapes instead of many: one path per colour, each the
// union of the fewest rectangles its pixels pack into. A row's run of one
// colour is a rectangle, and it grows downward while the row below repeats
// the same run exactly. Every pixel lands in exactly one rectangle, on whole
// numbers, so with shape-rendering crispEdges it draws the same pixels as a
// rect per run did. A 28×36 fighter is about ten elements where it was a few
// hundred, and the elements are what a page pays to send and to hydrate.
//
// No React, so the share image and the footer's ground tile encode with it
// too. Results are cached per grid, so a sprite drawn again costs nothing.

export type SpritePath = { fill: string; d: string };

/** Fill for one grid character, or null for transparent. */
export type ColorOf = (ch: string | undefined) => string | null;

export function encodeSprite(grid: string[], colorOf: ColorOf): SpritePath[] {
  const rows = grid.length;
  const cols = grid.reduce((n, row) => Math.max(n, row.length), 0);
  const fills = grid.map((row) => Array.from({ length: cols }, (_, x) => colorOf(row[x])));
  const used = fills.map(() => new Uint8Array(cols));
  const free = (y: number, x: number, fill: string) => fills[y][x] === fill && !used[y][x];

  // The run of `fill` that starts at x in row y, if it is exactly [x, x + w).
  const sameRun = (y: number, x: number, w: number, fill: string) => {
    for (let i = x; i < x + w; i++) if (!free(y, i, fill)) return false;
    return !(x > 0 && free(y, x - 1, fill)) && !(x + w < cols && free(y, x + w, fill));
  };

  const parts = new Map<string, string[]>(); // fill → rectangles, in first-seen order
  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < cols) {
      const fill = fills[y][x];
      if (!fill || used[y][x]) { x++; continue; }
      let w = 1;
      while (x + w < cols && free(y, x + w, fill)) w++;
      let h = 1;
      while (y + h < rows && sameRun(y + h, x, w, fill)) h++;
      for (let dy = 0; dy < h; dy++) used[y + dy].fill(1, x, x + w);
      const list = parts.get(fill) ?? parts.set(fill, []).get(fill)!;
      list.push(`M${x} ${y}h${w}v${h}h-${w}z`);
      x += w;
    }
  }
  return [...parts].map(([fill, rects]) => ({ fill, d: rects.join("") }));
}

// Cache: grid → (colour scheme key → paths). Grids, role maps and palettes are
// module constants, so identity is the key; a small cap per grid keeps a
// caller that builds its maps inline from growing it without bound.
const cache = new WeakMap<string[], Map<string, SpritePath[]>>();
const ids = new WeakMap<object, number>();
let nextId = 0;
const idOf = (o: object | undefined) => (o ? (ids.get(o) ?? (ids.set(o, ++nextId), nextId)) : 0);

export function cachedSprite(grid: string[], scheme: (object | undefined)[], colorOf: ColorOf): SpritePath[] {
  const key = scheme.map(idOf).join(":");
  let byScheme = cache.get(grid);
  if (!byScheme) cache.set(grid, (byScheme = new Map()));
  let paths = byScheme.get(key);
  if (!paths) {
    if (byScheme.size >= 8) byScheme.clear();
    byScheme.set(key, (paths = encodeSprite(grid, colorOf)));
  }
  return paths;
}

/** The paths as SVG markup, for a data URI or a file. */
export function spriteMarkup(paths: SpritePath[]): string {
  return paths.map((p) => `<path fill="${p.fill}" d="${p.d}"/>`).join("");
}
