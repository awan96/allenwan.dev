// src/components/site/scene/layout.ts
// Where everything in the hero diorama stands, in scene pixels. Pure
// geometry: the engine calls computeLayout() on every resize, and the React
// side reads the same result to place the apple's button and the whisper.

import { GRIDS } from "@/components/pixel/siteSprites";
import { APPLE_W, restingSpot } from "./apple";

export const TREE = GRIDS.apple_tree;
export const TREE_W = TREE[0].length;
export const TREE_H = TREE.length;
const TREE_MID = Math.floor(TREE_W / 2);

/** The hanging apple in tree-sprite pixels: the apple sprite's top-left,
    and the twig that joins its stem to the canopy's lower edge. It hangs
    under the right lobe, clear of the leaves, so it reads against the sky
    by lightness and not by red against green. */
export const APPLE_HANG = { x: 25, y: 19, twigX: 28, twigTop: 17 } as const;

/** Rows under the horizon: grass, one ink line, then the soil the page stands on. */
export const GROUND = { grass: 4, ink: 1, soil: 7 } as const;
export const GROUND_ROWS = GROUND.grass + GROUND.ink + GROUND.soil;

// A low knoll under the tree gives it a stage and gives a fallen apple a
// slope to roll down.
const KNOLL = { rise: 5, reach: 30 };

export type SceneLayout = {
  /** Scene size in scene pixels. */
  W: number;
  H: number;
  /** Device pixels per scene pixel (an integer, so every pixel is crisp). */
  p: number;
  /** CSS pixels per scene pixel (p / devicePixelRatio). */
  px: number;
  /** The canvas is bottom-anchored; this is its top edge in CSS px (<= 0). */
  top: number;
  stacked: boolean;
  horizon: number;
  /** Grass top row for each column. */
  surface: Int16Array;
  tree: { x: number; y: number; cx: number };
  apple: { x: number; y: number };
  twig: { x: number; top: number; bottom: number };
  rest: { x: number; y: number; rolled: number };
  /** The high sun or moon (day, night). */
  sun: { x: number; y: number };
  /** The low sun (dawn, dusk), half behind the hills at the apple's height. */
  lowSun: { x: number; y: number };
  /** The hero text's box in scene pixels, which the stars stay out of. */
  text: { x0: number; y0: number; x1: number; y1: number };
};

export type Measure = {
  width: number;
  height: number;
  pxCss: number;
  dpr: number;
  stacked: boolean;
  /** The site column's inner edges, in CSS px from the section's left. */
  colLeft: number;
  colRight: number;
  /** The hero text's box, in CSS px from the section's top-left. */
  text: { left: number; top: number; right: number; bottom: number };
};

export function computeLayout(m: Measure): SceneLayout {
  const p = Math.max(1, Math.round(m.pxCss * m.dpr));
  const px = p / m.dpr;
  const W = Math.ceil(m.width / px);
  const H = Math.ceil(m.height / px);
  const horizon = H - GROUND_ROWS;
  const halfTree = (TREE_W * px) / 2;

  // Desktop: toward the right of the site column, never under the text.
  // Phones: under the text, right of centre, with room for the apple to roll.
  let cssX = m.stacked
    ? m.width * 0.64
    : Math.max(m.colLeft + (m.colRight - m.colLeft) * 0.78, m.text.right + 32 + halfTree);
  cssX = Math.min(cssX, m.width - halfTree - 14 * px);
  const cx = Math.round(cssX / px);

  const surface = new Int16Array(W);
  for (let x = 0; x < W; x++) {
    const t = Math.max(-1, Math.min(1, (x - cx) / KNOLL.reach));
    surface[x] = horizon - Math.round((KNOLL.rise * (1 + Math.cos(Math.PI * t))) / 2);
  }

  const tree = { x: cx - TREE_MID, y: surface[Math.max(0, Math.min(W - 1, cx))] - TREE_H + 1, cx };
  const apple = { x: tree.x + APPLE_HANG.x, y: tree.y + APPLE_HANG.y };
  const twig = { x: tree.x + APPLE_HANG.twigX, top: tree.y + APPLE_HANG.twigTop, bottom: apple.y - 1 };

  const sun = m.stacked
    ? { x: Math.max(10, cx - 40), y: tree.y + 2 }
    : { x: Math.min(W - 14, cx + 44 + APPLE_W), y: Math.max(10, Math.round(horizon * 0.2)) };

  // The low sun shares the apple's rows, so it must never sit behind it:
  // the apple is the one thing in the scene to find. Right of the apple
  // when there's room (disc and halo reach 8 px), else the tree's far side.
  // Phones already keep it left of the tree.
  const clearOfApple = apple.x + APPLE_W + 1 + 12;
  const lowX = Math.min(cx + 44 + APPLE_W, W - 12);
  const lowSun = {
    x: m.stacked ? sun.x : lowX >= clearOfApple ? lowX : Math.max(10, tree.x - 10),
    y: horizon - 7,
  };

  const top = m.height - H * px;
  const text = {
    x0: Math.floor(m.text.left / px),
    y0: Math.floor((m.text.top - top) / px),
    x1: Math.ceil(m.text.right / px),
    y1: Math.ceil((m.text.bottom - top) / px),
  };

  return {
    W, H, p, px, top,
    stacked: m.stacked,
    horizon, surface, tree, apple, twig,
    rest: restingSpot(apple, surface),
    sun,
    lowSun,
    text,
  };
}

/** A scene-pixel rect in CSS px, relative to the section's top-left. */
export function toCss(l: SceneLayout, x: number, y: number, w: number, h: number) {
  return { left: x * l.px, top: l.top + y * l.px, width: w * l.px, height: h * l.px };
}
