// src/components/site/scene/hash.ts
// The scene's stable noise, on its own so the footer's ground and the 404's
// window can use it without pulling in the canvas drawing code.

/** Stable 0..1 noise for a coordinate, so the scene is the same every visit. */
export function hash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
