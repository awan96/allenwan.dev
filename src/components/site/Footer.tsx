// src/components/site/Footer.tsx
// The page ends on the same ground the hero stands on: a pixel strip of
// grass, then soil, with the footer written into the soil.

import { SITE } from "@/site";
import GroundStrip from "./GroundStrip";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <GroundStrip />
      <div className={styles.soil}>
        <div className={`wrap ${styles.row}`}>
          <p>© {new Date().getFullYear()} {SITE.name}</p>
          {/* Placeholder handles would link to the bare GitHub and
              LinkedIn home pages, so the footer waits for the real ones. */}
          {!SITE.placeholderContact && (
            <ul className={styles.links}>
              {SITE.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
                </li>
              ))}
              <li><a href={`mailto:${SITE.email}`}>Email</a></li>
              <li>
                <a href={SITE.resume} target="_blank" rel="noopener noreferrer">
                  Résumé<span className="visually-hidden"> (PDF, opens in a new tab)</span>
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
