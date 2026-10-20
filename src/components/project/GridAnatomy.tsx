// src/components/project/GridAnatomy.tsx
// What a sprite actually is: the grid of characters stored in the source,
// the picture it renders to, and the key between them. Reads the same
// sprite libraries the game and the editor do, so it can't drift.
//
//   <GridAnatomy name="sword" library="game-icons" caption="…" />

import type { CSSProperties } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import { ROLE_LETTERS } from "@/components/pixel/roles";
import { getTarget } from "@/components/pixel/targets";
import styles from "./GridAnatomy.module.css";

type Props = {
  name: string;
  /** A sprite-editor target id: game-icons, game-art, tarot-art or site. */
  library?: string;
  caption?: string;
};

export function GridAnatomy({ name, library = "game-icons", caption }: Props) {
  const target = getTarget(library);
  const grid = target?.grids[name];
  if (!target || !grid) return null;

  const roles = target.roles[name] ?? {};
  const cols = grid[0].length;
  const rows = grid.length;
  // Whole pixels only, about as tall as the text grid beside it.
  const px = Math.max(2, Math.floor(192 / Math.max(cols, rows)));

  const used = ROLE_LETTERS.filter((l) => grid.some((row) => row.includes(l)));
  const key = [
    ...(grid.some((row) => row.includes("o")) ? [{ ch: "o", color: target.palette.outline, name: "outline" }] : []),
    ...used.map((l) => ({ ch: l, color: target.palette[roles[l] ?? ""], name: roles[l] ?? "?" })),
  ];

  return (
    <figure className={styles.anatomy} data-block="">
      <div className={styles.panels}>
        <div className={styles.panel}>
          <span className={styles.tag}>In the source</span>
          <pre className={styles.grid} role="img" aria-label={`The ${name} sprite as ${rows} rows of text`}>
            {grid.map((row, y) => (
              <span key={y} className={styles.row}>
                {row.split("").map((ch, x) =>
                  ch === "." ? <span key={x} className={styles.dot}>.</span> : ch
                )}
                {"\n"}
              </span>
            ))}
          </pre>
        </div>

        <span className={styles.arrow} aria-hidden="true">→</span>

        <div className={styles.panel}>
          <span className={styles.tag}>On screen</span>
          <div className={styles.canvas} style={{ "--w": `${cols * px}px`, "--h": `${rows * px}px` } as CSSProperties}>
            <SpriteSvg grid={grid} roles={roles} palette={target.palette} scale={px} title={name.replace(/_/g, " ")} />
          </div>
        </div>
      </div>

      <ul className={styles.key} aria-label="Key">
        {key.map((k) => (
          <li key={k.ch}>
            <code className={styles.ch}>{k.ch}</code>
            <span className={styles.swatch} style={{ background: k.color }} aria-hidden="true" />
            <span>{k.name}</span>
          </li>
        ))}
        <li>
          <code className={styles.ch}>.</code>
          <span className={`${styles.swatch} ${styles.clear}`} aria-hidden="true" />
          <span>clear</span>
        </li>
      </ul>

      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
