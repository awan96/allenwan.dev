// src/components/site/InterestIcon.tsx
// An interest badge's pixel icon, found by name in the sprite libraries and
// drawn on the server, so the badges' client code never carries the
// libraries. A bare name is a site sprite (siteSprites.ts); "library/name"
// reaches another of the sprite editor's libraries (game-icons, game-art,
// fighters, tarot-art). No icon, or a name that isn't there, draws a "?".
//
// The SVG takes its size from CSS: --cols and --rows here, times the --px
// its container sets (InterestGrid.module.css), so every icon in a row
// shares one pixel size.

import type { CSSProperties } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import { getTarget } from "@/components/pixel/targets";

// "Icon to come", in currentColor.
const UNKNOWN = [
  "............",
  "....AAAA....",
  "...AA..AA...",
  "...AA..AA...",
  ".......AA...",
  "......AA....",
  ".....AA.....",
  ".....AA.....",
  "............",
  ".....AA.....",
  ".....AA.....",
  "............",
];
const INK = { ink: "currentColor" };

function size(grid: string[]): CSSProperties {
  return { "--cols": grid[0].length, "--rows": grid.length } as CSSProperties;
}

export default function InterestIcon({ icon }: { icon?: string }) {
  const [library, name] = icon?.includes("/") ? icon.split("/", 2) : ["site", icon];
  const target = getTarget(library);
  const grid = name ? target?.grids[name] : undefined;
  if (!target || !name || !grid) {
    return <SpriteSvg grid={UNKNOWN} roles={{ A: "ink" }} palette={INK} style={size(UNKNOWN)} />;
  }
  return <SpriteSvg grid={grid} roles={target.roles[name] ?? {}} palette={target.palette} style={size(grid)} />;
}
