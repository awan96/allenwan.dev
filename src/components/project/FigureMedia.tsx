// src/components/project/FigureMedia.tsx
// The two pieces of a figure that need the browser: a still you can click
// to see full size (a native <dialog>, so Esc, the focus trap and the
// return of focus come for free), and a looping clip that plays on its own
// only when the visitor allows motion.
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./Figure.module.css";

type MediaProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

/** A still that opens full size in a dialog. */
export function ZoomImage({ src, alt, className, style }: MediaProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.zoom}
        aria-label={alt ? `Enlarge image: ${alt}` : "Enlarge image"}
        onClick={() => dialog.current?.showModal()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- MDX images have no known size up front */}
        <img src={src} alt="" loading="lazy" className={className} style={style} />
      </button>
      <dialog
        ref={dialog}
        className={styles.lightbox}
        aria-label={alt || "Image"}
        // A click on the backdrop lands on the dialog itself: close.
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the full-size copy of the same image */}
        <img src={src} alt={alt} className={styles.full} />
        <form method="dialog">
          <button type="submit" className={styles.close}>Close</button>
        </form>
      </dialog>
    </>
  );
}

/** A muted, looping clip. Under reduced motion it holds still and shows
    its controls, so it plays only when asked. */
export function Clip({ src, alt, poster, className, style }: MediaProps & { poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Still until the preference is known, so nothing moves before it's read.
  const [still, setStill] = useState(true);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setStill(q.matches);
      const v = ref.current;
      if (!v) return;
      if (q.matches) v.pause();
      else v.play().catch(() => {});
    };
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      controls={still}
      aria-label={alt || undefined}
      className={className}
      style={style}
    />
  );
}
