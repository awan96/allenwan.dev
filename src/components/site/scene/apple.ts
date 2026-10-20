// src/components/site/scene/apple.ts
// The one apple's body in the scene: its sprite (turned as it rolls), the
// frames it grows back through, and the fall. The fall is a tiny fixed-step
// simulation, so the same code both animates a pick and finds, ahead of
// time, the spot where a fallen apple comes to rest after a reload.

import { GRIDS } from "@/components/pixel/siteSprites";

export const APPLE = GRIDS.apple;
export const APPLE_W = APPLE[0].length;
export const APPLE_H = APPLE.length;

/** A quarter turn clockwise; four of them are the apple rolling over. */
function turn(grid: string[]): string[] {
  const h = grid.length;
  const w = grid[0].length;
  return Array.from({ length: w }, (_, y) =>
    Array.from({ length: h }, (_, x) => grid[h - 1 - x][y]).join(""),
  );
}

export const APPLE_TURNS: string[][] = [APPLE, turn(APPLE), turn(turn(APPLE)), turn(turn(turn(APPLE)))];

/** Regrowth: a bud, a small fruit, a nearly-there one, then APPLE. Same
    frame and stem as APPLE, so each frame sits where the apple will hang. */
export const GROW_FRAMES: string[][] = [
  ["...DE.", "...C..", "......", "......", "......", "......"],
  ["...DE.", "...D..", "..AAA.", "..ABB.", "...B..", "......"],
  ["...DE.", ".AADA.", ".AAAA.", ".AAAB.", "..BB..", "......"],
];

export type AppleBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Distance travelled, which sets how far it has turned. */
  rolled: number;
  rolling: boolean;
  done: boolean;
  ticks: number;
};

const GRAVITY = 0.2;
const BOUNCE = 0.34;
const SLOPE_PULL = 0.09;
const FRICTION = 0.93;
/** Below this speed on the flat the apple has stopped; the friction tail
    under it only creeps. */
const STOP_VX = 0.06;
/** Scene pixels rolled per quarter turn: about a quarter of its girth. */
const QUARTER = 4.5;
/** The turns finish at this share of the roll, before the slow tail, so
    the apple settles upright instead of creeping on its side. */
const TURNS_BY = 0.8;

export function dropFrom(hang: { x: number; y: number }): AppleBody {
  // A small push to the right, as if the twig let go with a flick.
  return { x: hang.x, y: hang.y, vx: 0.14, vy: 0, rolled: 0, rolling: false, done: false, ticks: 0 };
}

/** Advance one tick (~33 ms). `surface` is the grass top row per column. */
export function stepApple(b: AppleBody, surface: Int16Array): void {
  const W = surface.length;
  const col = (x: number) => Math.max(0, Math.min(W - 1, Math.round(x + APPLE_W / 2 - 0.5)));
  // Resting, its bottom row sits on the grass's top row, nestled in.
  const floor = (x: number) => surface[col(x)] - (APPLE_H - 1);

  b.ticks++;
  if (!b.rolling) {
    b.vy += GRAVITY;
    b.x += b.vx;
    b.y += b.vy;
    if (b.y >= floor(b.x)) {
      b.y = floor(b.x);
      if (b.vy > 1.1) {
        b.vy = -b.vy * BOUNCE; // one small hop
        b.vx += 0.3;
      } else {
        b.vy = 0;
        b.rolling = true;
      }
    }
  } else {
    const c = col(b.x);
    // Positive when the ground falls away to the right (rows grow downward).
    const slope = (surface[Math.min(W - 1, c + 1)] - surface[Math.max(0, c - 1)]) / 2;
    b.vx = (b.vx + slope * SLOPE_PULL) * FRICTION;
    b.x += b.vx;
    b.y = floor(b.x);
    if ((Math.abs(b.vx) < STOP_VX && slope === 0) || b.ticks > 300) b.done = true;
  }
  b.rolled += Math.abs(b.vx);
  const maxX = W - APPLE_W - 1;
  if (b.x > maxX) {
    b.x = maxX;
    b.vx = 0;
  }
}

/** How far round the apple has turned, 0–3 quarter turns. `total` is the
    whole roll's length (from restingSpot): the quarters are stretched to
    fit it in whole turns, so the apple always comes to rest upright. */
export function turnOf(rolled: number, total: number): number {
  if (total <= 0) return 0;
  const quarters = 4 * Math.max(1, Math.round((total * TURNS_BY) / (4 * QUARTER)));
  const progress = Math.min(1, rolled / (total * TURNS_BY));
  return Math.floor(quarters * progress) % 4;
}

/** Where an apple dropped from `hang` ends up, and how far it rolls to
    get there: run the fall to the end. */
export function restingSpot(hang: { x: number; y: number }, surface: Int16Array) {
  const b = dropFrom(hang);
  while (!b.done) stepApple(b, surface);
  return { x: Math.round(b.x), y: Math.round(b.y), rolled: b.rolled };
}
