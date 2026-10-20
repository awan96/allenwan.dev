// src/components/project/SpriteShowcase.tsx
// The game's own art, drawn live from its sprite data on a Hearthlight
// stage, instead of a screenshot of it. Each figure stands on its stretch
// of stone with its name written in the floor.
//
//   <SpriteShowcase caption="…">
//     <Sprite name="me_combat" label="The squire" />
//     <Sprite name="boss_ulgar" label="Ulgar" flip />
//   </SpriteShowcase>

import type { ReactNode } from "react";
import HearthStage, { StageFigure } from "./HearthStage";
import styles from "./SpriteShowcase.module.css";

export function SpriteShowcase({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className={styles.showcase} data-wide="">
      <div className={styles.frame}>
        <HearthStage>{children}</HearthStage>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

export function Sprite(props: { name: string; label?: string; flip?: boolean }) {
  return <StageFigure {...props} />;
}
