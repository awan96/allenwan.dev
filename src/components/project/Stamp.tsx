// src/components/project/Stamp.tsx
// An inline stamped tag inside a case study's prose: the stack stamps' look
// (mono caps, a 1.5px border, a small tilt, the rubber-stamp mask), small
// enough to sit after a paragraph's bold label or at the end of a heading.
// With icon="hourglass" it carries the coming-soon box's pixel hourglass,
// so "in progress" reads by shape as well as by the word.
//
//   **Memory trigger.** <Stamp icon="hourglass">In progress</Stamp> Ongoing work…
//   ## Gifts <Stamp icon="hourglass">Current work</Stamp>

import type { ReactNode } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import { HOURGLASS } from "@/components/site/ui";
import styles from "./Stamp.module.css";

const INK = { ink: "currentColor" };

export function Stamp({ children, icon }: { children: ReactNode; icon?: "hourglass" }) {
  return (
    <span className={styles.stamp}>
      {icon === "hourglass" && (
        <SpriteSvg grid={HOURGLASS} roles={{ A: "ink" }} palette={INK} className={styles.glyph} />
      )}
      <span>{children}</span>
    </span>
  );
}
