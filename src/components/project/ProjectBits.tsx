// src/components/project/ProjectBits.tsx
// Small pieces the card, the case-study header and the next-project link
// share: the framed pixel icon and the "year · role" line. (The Filler
// stamp lives with the site primitives in components/site/ui.tsx.)

import type { CSSProperties } from "react";
import SiteSprite from "@/components/pixel/SiteSprite";
import { GRIDS } from "@/components/pixel/siteSprites";
import type { ProjectMeta } from "@/lib/projects";
import styles from "./ProjectBits.module.css";

/** "2026 · Design, engine, art", skipping whichever half is empty. */
export function metaLine(p: Pick<ProjectMeta, "year" | "role">): string {
  return [p.year, p.role].filter(Boolean).join(" · ");
}

/** The project's pixel icon in a small frame. The frame reads as a blank
    canvas when the sprite isn't drawn yet, so a missing icon never looks
    broken. `size` picks the whole-pixel scale: sm 4×, lg 8× (4× on phones). */
export function IconTile({ name, size = "sm" }: { name?: string; size?: "sm" | "lg" }) {
  const grid = name ? GRIDS[name] : undefined;
  const vars = grid
    ? ({ "--cols": grid[0].length, "--rows": grid.length } as CSSProperties)
    : undefined;
  return (
    <span className={`${styles.tile} ${size === "lg" ? styles.lg : ""}`} aria-hidden="true">
      {name && grid && <SiteSprite name={name} className={styles.sprite} style={vars} />}
    </span>
  );
}
