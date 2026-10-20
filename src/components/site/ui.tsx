// src/components/site/ui.tsx
// The handful of primitives every site page shares: the one big button,
// the quiet link, stamped tags, and the page / section headers.

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import styles from "./ui.module.css";

type LinkProps = {
  href: string;
  children: ReactNode;
  /** Shows a trailing arrow that nudges on hover. */
  arrow?: boolean;
  className?: string;
  /** Next's prefetch. Links to /game pass false, or every page that shows
      one would download the whole game in the background. */
  prefetch?: boolean;
};

function isExternal(href: string) {
  return /^(https?:|mailto:)/.test(href);
}

/** A file served from public/ (the résumé), not a page: a plain link, so
    Next never tries to route to it or prefetch it. */
function isFile(href: string) {
  return /^\/[^?#]*\.\w+$/.test(href);
}

function SmartLink({ href, className, prefetch, children }: { href: string; className: string; prefetch?: boolean; children: ReactNode }) {
  if (isExternal(href) || isFile(href)) {
    const newTab = !href.startsWith("mailto:");
    return (
      <a href={href} className={className} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return <Link href={href} className={className} prefetch={prefetch}>{children}</Link>;
}

/** The screen's one big action. `ink` swaps green for ink on tinted grounds. */
export function ButtonLink({ href, children, arrow, ink, className, prefetch }: LinkProps & { ink?: boolean }) {
  return (
    <SmartLink href={href} prefetch={prefetch} className={`${styles.btn} ${ink ? styles.btnInk : ""} ${className ?? ""}`}>
      {children}
      {arrow && <span className={styles.arrow} aria-hidden="true">→</span>}
    </SmartLink>
  );
}

/** A secondary action: plain text, ink underline draws in on hover. */
export function QuietLink({ href, children, arrow, className, prefetch }: LinkProps) {
  return (
    <SmartLink href={href} prefetch={prefetch} className={`${styles.quiet} ${className ?? ""}`}>
      {children}
      {arrow && <span className={styles.arrow} aria-hidden="true">→</span>}
    </SmartLink>
  );
}

/** The quiet link's look on a button, for an action on the page itself
    (unfolding a list); the arrow says which way the page will grow. */
export function QuietButton({ children, arrow, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { arrow?: "down" | "up" }) {
  return (
    <button type="button" {...rest} className={`${styles.quiet} ${styles.quietButton} ${className ?? ""}`}>
      {children}
      {arrow && <span className={`${styles.arrow} ${arrow === "down" ? styles.arrowDown : styles.arrowUp}`} aria-hidden="true">{arrow === "down" ? "↓" : "↑"}</span>}
    </button>
  );
}

// Small fixed tilts, cycled, so a row of stamps looks hand-pressed but the
// same row always renders the same way (no hydration drift).
const TILTS = ["-1.5deg", "1deg", "-0.5deg", "1.5deg", "-1deg", "0.5deg"];

export function Stamps({ items, label = "Tags" }: { items: readonly string[]; label?: string }) {
  if (!items.length) return null;
  return (
    <ul className={styles.stamps} aria-label={label}>
      {items.map((t, i) => (
        <li key={t} className={styles.stamp} style={{ ["--tilt" as string]: TILTS[i % TILTS.length] }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Marks placeholder content until Allen swaps in his own. Dashed (shape,
    not just colour) so it never reads as one of the solid stack stamps. */
export function FillerStamp({ id, className }: { id?: string; className?: string }) {
  return (
    <span id={id} className={`${styles.filler} ${className ?? ""}`}>
      Filler
    </span>
  );
}

// A 10×12 hourglass, sand still up top, drawn in currentColor.
export const HOURGLASS = [
  "AAAAAAAAAA",
  ".A......A.",
  ".A.AAAA.A.",
  "..A.AA.A..",
  "...A..A...",
  "....AA....",
  "....AA....",
  "...A..A...",
  "..A....A..",
  ".A..AA..A.",
  ".A.AAAA.A.",
  "AAAAAAAAAA",
];
const INK = { ink: "currentColor" };

/** Stands in for a part of the site still being written, in production
    (COMING_SOON in site.ts). Hatched and dashed like a figure's "Image to
    come", so it reads as unfinished on purpose, not as broken. */
export function ComingSoon({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.soon}>
      <SpriteSvg grid={HOURGLASS} roles={{ A: "ink" }} palette={INK} className={styles.soonGlyph} />
      <span className={styles.soonLabel}>Coming soon</span>
      <p className={styles.soonText}>{children}</p>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, lede }: { eyebrow?: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <header className={styles.pageHeader}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className={styles.pageTitle}>{title}</h1>
      {lede && <p className={styles.pageLede}>{lede}</p>}
    </header>
  );
}

export function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.sectionHead}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

type DetailHeaderProps = {
  /** Where the back link goes, and what it says ("All work"). */
  back: { href: string; label: string };
  /** The mono line over the title: a year and role, or a date. */
  meta?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  stamps?: readonly string[];
  stampsLabel?: string;
  /** The page's one big action, and at most a quiet link beside it. */
  actions?: ReactNode;
  /** Right of the text: an icon tile, or a cover when `cover` is set. */
  art?: ReactNode;
  /** The art is a wide cover (a live stage, an image), not a small tile. */
  cover?: boolean;
  /** Sits between the back link and the header (e.g. a Filler note). */
  note?: ReactNode;
};

/** The header of a detail page, a case study or a post: one template, so
    the back link, the title and the closing rule line up across both. */
export function DetailHeader({ back, meta, title, lede, stamps, stampsLabel, actions, art, cover, note }: DetailHeaderProps) {
  const layout = art ? (cover ? styles.hasCover : styles.hasArt) : "";
  return (
    <>
      <QuietLink href={back.href} className={styles.back}>
        <span aria-hidden="true">←</span> {back.label}
      </QuietLink>
      {note}
      <header className={`${styles.detailHeader} ${layout}`}>
        <div className={styles.detailText}>
          {meta && <p className={`eyebrow ${styles.detailMeta}`}>{meta}</p>}
          <h1 className={styles.detailTitle}>{title}</h1>
          {lede && <p className={styles.detailLede}>{lede}</p>}
          {stamps && <Stamps items={stamps} label={stampsLabel} />}
          {actions && <div className={styles.detailActions}>{actions}</div>}
        </div>
        {art && <div className={styles.detailArt}>{art}</div>}
      </header>
    </>
  );
}
