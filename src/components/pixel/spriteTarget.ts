// The shape of one sprite library as the sprite editor sees it, and the grid
// sizes the editor accepts. Shared by the site's registry (siteTargets.ts)
// and the game's (components/game/pixel/gameTargets.ts); targets.ts merges
// the two for the editor and the dev save route.

import type { RoleMap } from "./roles";

export const MIN_SIZE = 3;
export const MAX_SIZE = 64;

export type SpriteTarget = {
  id: string;
  label: string;
  /** Repo-relative write path. The server route resolves id → this path;
      the client never supplies a path directly. */
  file: string;
  grids: Record<string, string[]>;
  roles: Record<string, RoleMap>;
  palette: Record<string, string>;
  mutedPalette?: Partial<Record<string, string>>;
  /** Locked dimensions — game icons must stay 12×12 for the game UI, and
      fighters 28×36 so they share one ground line. */
  fixedSize?: { width: number; height: number };
  defaultSize: { width: number; height: number };
  defaultRoles: RoleMap;
};
