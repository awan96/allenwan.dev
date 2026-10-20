// src/components/project/Stats.tsx
// Headline numbers for a case study: three cells in a ruled row that stacks
// on phones. Every number on a real page should be one you can point at in
// the code or the data.
//
//   <Stats>
//     <Stat value="78" label="tarot cards" />
//     ...
//   </Stats>

import type { ReactNode } from "react";
import styles from "./Stats.module.css";

export function Stats({ children }: { children: ReactNode }) {
  return <dl className={styles.stats} data-block="">{children}</dl>;
}

/** The label comes first in the markup (a <dt> must precede its <dd>);
    the layout lifts the number above it. */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
