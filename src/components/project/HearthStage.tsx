// src/components/project/HearthStage.tsx
// A small window into the game's world (Hearthlight): a dark shell, a warm
// light behind the figures, and a stone floor they stand on. Shared by the
// flagship card on /projects and by SpriteShowcase inside case studies, so
// the game's art is always shown live, never as a screenshot.

import { Children, isValidElement, useId, type CSSProperties, type ReactNode } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import { GRIDS, ICON_ROLES, PALETTE } from "./stageFighters";
import { DIRT_PATHS, DIRT_TILE } from "./stageDirt";
import styles from "./HearthStage.module.css";

/** The stage's back wall. "dirt" is pixel dirt (stageDirt.ts), the wall
    since Allen chose it for the home page's scroll animation (2026-10-06,
    docs/HOME_SCROLL.md). "paper" is the site's paper grain, the wall before
    that; switching back is this one word. */
export const STAGE_WALL: "paper" | "dirt" = "dirt";

// The dirt layer's span in art pixels: wide and tall enough to cover any
// stage at its pixel size, clipped to the stage by its wrapper.
const SPAN_W = 240;
const SPAN_H = 160;

/** The pixel dirt behind the figures and the floor: one tile of specks
    (stageDirt.ts), repeated by an inline pattern at the stage's pixel size,
    the art's own. Allen picked it from three walls side by side on
    2026-10-06, banked it the same day, and switched it on that night for
    the scroll animation. It is no faster than the grain: drawn inline it is
    no image, so the stage stops being the page's largest paint, but
    measured, the largest paint came no sooner. */
function Dirt() {
  const id = `dirt${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    // A span, so the duel's :first-of-type and :last-of-type still find the
    // two figures (divs).
    <span className={styles.dirtWrap} aria-hidden="true">
      <svg className={styles.dirt} viewBox={`0 0 ${SPAN_W} ${SPAN_H}`} shapeRendering="crispEdges" style={{ "--span-w": SPAN_W, "--span-h": SPAN_H } as CSSProperties}>
        <defs>
          <pattern id={id} width={DIRT_TILE} height={DIRT_TILE} patternUnits="userSpaceOnUse">
            {DIRT_PATHS.map((p) => (
              <path key={p.fill} d={p.d} fill={p.fill} />
            ))}
          </pattern>
        </defs>
        <rect width={SPAN_W} height={SPAN_H} fill={`url(#${id})`} />
      </svg>
    </span>
  );
}

/** Empty rows under a grid's lowest pixel, so feet can land on the floor. */
function blankRowsBelow(grid: string[]): number {
  let n = 0;
  for (let y = grid.length - 1; y >= 0 && /^\.*$/.test(grid[y]); y--) n++;
  return n;
}

/** Empty columns right of the feet on a grid's lowest drawn row: the room
    beside them for something set down (`atFeet`). */
function roomBesideFeet(grid: string[]): number {
  for (let y = grid.length - 1; y >= 0; y--) {
    const drawn = grid[y].replace(/\.+$/, "").length;
    if (drawn > 0) return grid[y].length - drawn;
  }
  return 0;
}

type FigureProps = {
  /** A fighter's name among the ones the stage draws (stageFighters.ts),
      e.g. "me_combat". */
  name: string;
  /** Mirror it, so a foe faces the hero the way the duel stage does. */
  flip?: boolean;
  /** Written into the floor under the figure. One short line. */
  label?: string;
  /** Something set down at the figure's feet, toward the middle of a duel
      (the squire's apple). It stands on the same floor and never moves the
      figure off its mark. */
  atFeet?: ReactNode;
};

/** One figure standing on its own stretch of floor. The pixel size comes
    from the stage (--px), always a whole number, so the art stays crisp. */
export function StageFigure({ name, flip, label, atFeet }: FigureProps) {
  const grid = GRIDS[name];
  if (!grid) return null;
  const vars = {
    "--cols": grid[0].length,
    "--rows": grid.length,
    "--blank": blankRowsBelow(grid),
  } as CSSProperties;
  // The label below names it; the art itself stays decorative.
  const sprite = (
    <SpriteSvg
      grid={grid}
      roles={ICON_ROLES[name] ?? {}}
      palette={PALETTE}
      scale={2}
      className={`${styles.sprite} ${flip ? styles.flip : ""}`}
      style={vars}
    />
  );
  return (
    <div className={styles.figure}>
      <div className={styles.standing}>
        {atFeet ? (
          <div className={styles.body}>
            {sprite}
            <div
              className={`${styles.atFeet} ${flip ? styles.atFeetFlip : ""}`}
              style={{ "--room": roomBesideFeet(grid) } as CSSProperties}
            >
              {atFeet}
            </div>
          </div>
        ) : (
          sprite
        )}
      </div>
      <div className={styles.floor}>
        {label && <span className={styles.label}>{label}</span>}
      </div>
    </div>
  );
}

type StageProps = {
  children: ReactNode;
  /** "row" lines figures up side by side; "duel" spreads two apart. */
  layout?: "row" | "duel";
  className?: string;
};

export default function HearthStage({ children, layout = "row", className }: StageProps) {
  // Column counts that divide the cast, so every row is full and the floor
  // runs edge to edge: all in one row when there's room, else two rows.
  const n = Math.max(1, Children.toArray(children).filter(isValidElement).length);
  const cols = { "--n": n, "--n-sm": n > 3 ? Math.ceil(n / 2) : n } as CSSProperties;
  return (
    <div
      className={`${styles.stage} ${layout === "duel" ? styles.duel : ""} ${STAGE_WALL === "paper" ? styles.paper : ""} ${className ?? ""}`}
      style={layout === "duel" ? undefined : cols}
    >
      {STAGE_WALL === "dirt" && <Dirt />}
      {children}
    </div>
  );
}
