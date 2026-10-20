// src/components/project/Figure.tsx
// Images and clips in a case study. A still opens full size on click; a
// clip (an .mp4 or .webm) loops muted, and holds still under reduced
// motion. With no `src` yet, Figure draws an honest placeholder at the real
// aspect ratio, so a page's layout is final before its screenshots exist.
// Props are plain strings because the MDX loader strips JS expressions
// (next-mdx-remote's blockJS default).

import type { CSSProperties, ReactNode } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import { Clip, ZoomImage } from "./FigureMedia";
import styles from "./Figure.module.css";

/** A clip, not a still: the source is an mp4 or a webm. (Here, not in the
    client module, so server components can call it.) */
export function isClip(src: string): boolean {
  return /\.(mp4|webm)(\?.*)?$/i.test(src);
}

// A 12×10 "picture" glyph (hills under a sun), drawn in currentColor.
const PICTURE = [
  "AAAAAAAAAAAA",
  "A..........A",
  "A.......AA.A",
  "A.......AA.A",
  "A..A.......A",
  "A.AAA...A..A",
  "AAAAAA.AAA.A",
  "AAAAAAAAAAAA",
  "AAAAAAAAAAAA",
  "AAAAAAAAAAAA",
];
const INK = { ink: "currentColor" };

/** "16/9", "16:9" or "1.5" → a CSS aspect-ratio value. */
function toRatio(ratio: string | undefined, fallback: string): string {
  const r = (ratio ?? fallback).trim().replace(":", "/");
  return /^\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?$/.test(r) ? r : fallback;
}

type FigureProps = {
  /** An image, or a clip when it ends in .mp4 or .webm. */
  src?: string;
  /** A clip's still before it plays. */
  poster?: string;
  alt?: string;
  caption?: string;
  /** Width / height, e.g. "16/9". Defaults to 16/9, or 9/19 in a phone. */
  ratio?: string;
  /** Draw device chrome around the image. */
  frame?: "browser" | "phone";
  /** Shown in the browser frame's address bar. */
  url?: string;
  /** Break out of the prose column to the page's full width. */
  wide?: boolean;
  children?: ReactNode;
};

export function Figure({ src, poster, alt = "", caption, ratio, frame, url, wide, children }: FigureProps) {
  const aspect = toRatio(ratio, frame === "phone" ? "9/19" : "16/9");
  const captioned = Boolean(caption || children);
  // Real media keeps its own shape unless the author fixes a ratio, and
  // then it's letterboxed, never cropped. Only the placeholder needs a
  // ratio by default, since it has no pixels to size it.
  const fit = {
    className: `${styles.img} ${ratio ? styles.fit : ""}`,
    style: ratio ? { aspectRatio: aspect } : undefined,
  };
  const media = src ? (
    isClip(src) ? (
      <Clip src={src} poster={poster} alt={alt} {...fit} />
    ) : (
      <ZoomImage src={src} alt={alt} {...fit} />
    )
  ) : (
    <div className={styles.placeholder} style={{ aspectRatio: aspect } as CSSProperties} role="img" aria-label={alt ? `Image to come: ${alt}` : "Image to come"}>
      <SpriteSvg grid={PICTURE} roles={{ A: "ink" }} palette={INK} className={styles.glyph} />
      <span className={styles.phLabel}>Image to come</span>
      {/* The caption below already says what goes here. */}
      {alt && !captioned && <span className={styles.phAlt}>{alt}</span>}
    </div>
  );

  return (
    <figure className={`${styles.figure} ${frame === "phone" ? styles.isPhone : ""}`} data-wide={wide ? "" : undefined}>
      {frame === "browser" ? (
        <div className={styles.browser}>
          <div className={styles.bar} aria-hidden="true">
            <span className={styles.dots}><i /><i /><i /></span>
            {url && <span className={styles.url}>{url}</span>}
          </div>
          {media}
        </div>
      ) : frame === "phone" ? (
        <div className={styles.phone}>
          <span className={styles.notch} aria-hidden="true" />
          {media}
        </div>
      ) : (
        <div className={src ? styles.plain : styles.pending}>{media}</div>
      )}
      {captioned && <figcaption className={styles.caption}>{caption ?? children}</figcaption>}
    </figure>
  );
}

/** A row of Figures: a grid on desktop, a swipeable strip on phones. The
    strip takes focus so a keyboard can scroll it (Safari won't focus a
    scroller on its own), which costs one extra tab stop on desktop.
    `narrow` keeps the row in the prose column and never swipes: the
    figures shrink side by side instead, so a pair of phone shots can
    still be compared on a phone. */
export function Gallery({ children, caption, narrow }: { children: ReactNode; caption?: string; narrow?: boolean }) {
  return (
    <figure className={styles.gallery} data-wide={narrow ? undefined : ""} data-narrow={narrow ? "" : undefined}>
      <div className={styles.strip} tabIndex={narrow ? undefined : 0} role="group" aria-label={caption ?? "Gallery"}>
        {children}
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
