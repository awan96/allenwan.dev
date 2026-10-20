// src/components/site/NotFoundScene.tsx
// The 404's window onto the orchard by day: the bare tree on its grass (its
// one apple is out in the world, in the hero or at the squire's feet, so
// it isn't drawn here). Every size is a whole number of art pixels at the
// site's --art-px, the same scale as the hero and the footer's ground.
//
// A client component only so the page's payload carries a reference to it,
// not the hundreds of rects the tree is drawn with: both 404 boundaries
// (the site's and the root's) are serialized into every page.
"use client";

import type { CSSProperties } from "react";
import SiteSprite from "@/components/pixel/SiteSprite";
import { GRIDS } from "@/components/pixel/siteSprites";
import { GROUND_TILE } from "./ground";
import styles from "./NotFoundScene.module.css";

const TREE = "apple_tree";

/** Blank rows under a grid's lowest painted pixel, so the trunk can stand
    on the grass whatever padding the art carries. */
function blankRowsBelow(grid: string[]): number {
  let n = 0;
  for (let y = grid.length - 1; y >= 0 && !/[^.]/.test(grid[y]); y--) n++;
  return n;
}

export default function NotFoundScene() {
  const grid = GRIDS[TREE] ?? [];
  const vars = {
    "--cols": grid[0]?.length ?? 0,
    "--rows": grid.length,
    "--blank": blankRowsBelow(grid),
  } as CSSProperties;
  return (
    <div className={styles.scene} aria-hidden="true">
      <SiteSprite name={TREE} className={styles.tree} style={vars} />
      <div className={styles.soil} />
      <div className={styles.grass} style={{ backgroundImage: GROUND_TILE }} />
    </div>
  );
}
