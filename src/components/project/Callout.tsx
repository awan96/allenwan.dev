// src/components/project/Callout.tsx
// A boxed aside in a case study: a decision made, a lesson learned, or a
// trade-off accepted. Each kind is told apart by its word and its pixel
// glyph (a signpost, a bulb, a pair of scales); the colour only repeats it.
//
//   <Callout kind="decision" title="Cards show the engine's own numbers">
//   Markdown body…
//   </Callout>

import type { ReactNode } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import styles from "./Callout.module.css";

// 11×11 glyphs, one ink, drawn in currentColor.
const SIGNPOST = [
  "....A......",
  "AAAAAAAAA..",
  "AAAAAAAAAA.",
  "AAAAAAAAAAA",
  "AAAAAAAAAA.",
  "AAAAAAAAA..",
  "....A......",
  "....A......",
  "....A......",
  "....A......",
  "..AAAAA....",
];
const BULB = [
  "...AAAAA...",
  "..AAAAAAA..",
  ".AA..AAAAA.",
  ".A..AAAAAA.",
  ".AAAAAAAAA.",
  "..AAAAAAA..",
  "...AAAAA...",
  "...........",
  "...AAAAA...",
  "...........",
  "....AAA....",
];
const SCALES = [
  "...........",
  ".....A.....",
  ".AAAAAAAAA.",
  ".A...A...A.",
  "A.A..A..A.A",
  "AAA..A..AAA",
  ".....A.....",
  ".....A.....",
  ".....A.....",
  "...AAAAA...",
  "...........",
];
const INK = { ink: "currentColor" };

const KINDS = {
  decision: { word: "Decision", glyph: SIGNPOST },
  lesson: { word: "Lesson", glyph: BULB },
  tradeoff: { word: "Trade-off", glyph: SCALES },
} as const;

type Kind = keyof typeof KINDS;

export function Callout({ kind = "decision", title, children }: { kind?: Kind; title?: string; children: ReactNode }) {
  const k = KINDS[kind] ?? KINDS.decision;
  return (
    <aside className={`${styles.callout} ${styles[kind] ?? ""}`} data-block="">
      <p className={styles.head}>
        <SpriteSvg grid={[...k.glyph]} roles={{ A: "ink" }} palette={INK} className={styles.glyph} />
        <span className={styles.word}>{k.word}</span>
      </p>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
