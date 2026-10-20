// src/components/site/GroundStrip.tsx
// The top edge of the footer: the hero's ground again (ground.ts), so the
// page opens and closes on the same ground; the footer's soil follows
// underneath. Its pixel size is the site's --art-px, the hero's own.

import { GROUND_TILE } from "./ground";
import styles from "./Footer.module.css";

export default function GroundStrip() {
  return <div aria-hidden="true" className={styles.ground} style={{ backgroundImage: GROUND_TILE }} />;
}
