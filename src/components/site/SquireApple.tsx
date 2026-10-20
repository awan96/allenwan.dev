// src/components/site/SquireApple.tsx
// The carried apple (D2): once a visitor picks up the hero's apple, it sits
// at the squire's feet in the game's windows (the home page's game card, the
// /projects flagship, the game's case study) until the game eats it at the
// start of the next run. The tree stays bare meanwhile, so a visitor never
// sees two apples at once. Before the pick-up, nothing shows.
"use client";

import type { CSSProperties } from "react";
import SiteSprite from "@/components/pixel/SiteSprite";
import { GRIDS } from "@/components/pixel/siteSprites";
import { useApple } from "./useApple";
import styles from "./SquireApple.module.css";

const SIZE = { "--cols": GRIDS.apple[0].length, "--rows": GRIDS.apple.length } as CSSProperties;

export default function SquireApple() {
  const apple = useApple();
  if (apple !== "pocket") return null;
  return <SiteSprite name="apple" className={styles.apple} style={SIZE} />;
}
