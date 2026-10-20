// src/app/(site)/contact/page.tsx
// A ledger of ways to reach Allen: email first and biggest, then the
// socials, then the résumé. Every value comes from src/site.ts.

import type { Metadata } from "next";
import { PageHeader } from "@/components/site/ui";
import { SITE, pageMeta } from "@/site";
import styles from "./contact.module.css";

export const metadata: Metadata = pageMeta({
  title: "Contact",
  description: `How to reach ${SITE.name}.`,
  path: "/contact",
});

type Row = { label: string; value: string; href: string; primary?: boolean; newTab?: boolean };

// The big address may have to wrap on a narrow phone: offer the break after
// the @, so it wraps as "name@" / "domain" and never between two letters.
function breakAfterAt(address: string) {
  const at = address.lastIndexOf("@");
  if (at < 0) return address;
  return (
    <>
      {address.slice(0, at + 1)}
      <wbr />
      {address.slice(at + 1)}
    </>
  );
}

const ROWS: Row[] = [
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}`, primary: true },
  ...SITE.socials.map((s) => ({ label: s.label, value: s.handle, href: s.href })),
  { label: "Résumé", value: "Download PDF", href: SITE.resume, newTab: true },
];

export default function Contact() {
  return (
    <main id="main" className="wrap">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        lede="The best way to reach me is email."
      />

      <ul className={styles.ledger}>
        {ROWS.map((row) => {
          const newTab = row.newTab ?? row.href.startsWith("http");
          if (SITE.placeholderContact) {
            return (
              <li key={row.label}>
                <div className={`${styles.row} ${styles.inert} ${row.primary ? styles.primary : ""}`}>
                  <span className={styles.label}>{row.label}</span>
                  <span className={styles.value}>{row.value}</span>
                </div>
              </li>
            );
          }
          return (
            <li key={row.label}>
              <a
                href={row.href}
                className={`${styles.row} ${row.primary ? styles.primary : ""}`}
                {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className={styles.label}>{row.label}</span>
                <span className={styles.value}>{row.primary ? breakAfterAt(row.value) : row.value}</span>
                <span className={styles.arrow} aria-hidden="true">{newTab ? "↗" : "→"}</span>
                {newTab && <span className="visually-hidden"> (opens in a new tab)</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
