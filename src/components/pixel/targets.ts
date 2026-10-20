// Registry of every sprite library the sprite editor can read from and
// (in dev) write to. Client-safe: only imports sprite data modules.
//
// Each target file must contain `export const GRIDS ... = { ... };` and
// `export const ICON_ROLES ... = { ... };` blocks in the shared format —
// the dev save route splices entries into those blocks by line, keeping
// them alphabetized (see app/api/dev/sprites/route.ts).
//
// The site's library is registered in siteTargets.ts and the game's four in
// components/game/pixel/gameTargets.ts; this file only merges them. The
// public site export (scripts/export-site.mjs) drops the game's two lines,
// so the exported editor serves the site's library alone.

import { SITE_TARGETS } from "./siteTargets";
import type { SpriteTarget } from "./spriteTarget";

export { MIN_SIZE, MAX_SIZE, type SpriteTarget } from "./spriteTarget";

export const TARGETS: SpriteTarget[] = [...SITE_TARGETS];

export function getTarget(id: string): SpriteTarget | undefined {
  return TARGETS.find((t) => t.id === id);
}
