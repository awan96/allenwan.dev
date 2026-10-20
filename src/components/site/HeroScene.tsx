// src/components/site/HeroScene.tsx
// The home page's hero: a full-bleed pixel diorama under the headline. The
// sky follows the visitor's clock, the redrawn tree stands on its knoll,
// and the one apple (lib/apple.ts, D2) hangs under it: pick it and it
// falls, pick it up and it waits at the squire's feet in the game's window
// (SquireApple) until the game eats it.
//
// The canvas is decoration; the apple is a real button laid over it, so it
// works by keyboard and screen reader. scene/engine.ts draws the pixels.
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { writeApple, type AppleState } from "@/lib/apple";
import { darknessAt, dominantSky, scrollHour, startHour, TONES, type Tone } from "@/lib/sky";
import { APPLE_H, APPLE_W } from "./scene/apple";
import { SceneEngine, type CssColors } from "./scene/engine";
import { toCss, type SceneLayout } from "./scene/layout";
import { useApple } from "./useApple";
import styles from "./HeroScene.module.css";

const WHISPER_MS = 5000;
/** The smallest the apple's button gets, so a thumb can find it. */
const HIT_MIN = 40;

/** Lighten a #rrggbb toward white (the soil's pebbles). */
function lighten(hex: string, by: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * by);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

export default function HeroScene({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const whisperRef = useRef<HTMLAnchorElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);

  const apple = useApple();
  const prevApple = useRef<AppleState | null>(null);
  const [layout, setLayout] = useState<SceneLayout | null>(null);
  const [whisper, setWhisper] = useState(false);
  // True while a fall plays out: the button waits, ring hidden, until the
  // apple is under it.
  const [falling, setFalling] = useState(false);
  const [said, setSaid] = useState("");
  const whisperHeld = useRef(false);
  const whisperTimer = useRef(0);
  const focusWhisper = useRef(false);

  // Mount: build the engine and keep it fitted, awake only while seen.
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const darkQ = window.matchMedia("(prefers-color-scheme: dark)");
    const motionQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const readCss = (sky: Tone): CssColors => {
      const cs = getComputedStyle(section.querySelector(`[data-probe="${sky}"]`)!);
      const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
      const soil = v("--color-soil", "#5d4030");
      return {
        bands: [0, 1, 2, 3, 4].map((i) => v(`--sky-b${i}`, "#c2dadf")),
        soil: {
          base: soil,
          light: soil.startsWith("#") ? lighten(soil, 0.16) : soil,
          dark: v("--color-soil-dark", "#3f2b20"),
        },
      };
    };

    const engine = new SceneEngine(canvas, darkQ.matches, motionQ.matches, readCss);
    engine.onSettle = () => setFalling(false);
    engineRef.current = engine;

    // Every visit starts in its sky, near the visitor's own time (startHour),
    // or on a testing pin (?hour=, ?sky=; docs/HOME_SCROLL.md §2.3).
    const search = window.location.search;
    const pinned = /[?&](hour|sky)=/.test(search);
    let base = startHour(search);
    engine.setTime(base);

    // The hero pins where it sits, under the sticky nav, so the nav's height
    // goes on <html> as --nav-h (HeroScene.module.css), kept current as the
    // nav wraps or the fonts land.
    const nav = document.querySelector<HTMLElement>(".site-shell > header");
    const navRo = new ResizeObserver(() => {
      if (nav) document.documentElement.style.setProperty("--nav-h", `${nav.getBoundingClientRect().height}px`);
    });
    if (nav) navRo.observe(nav);

    const measure = () => {
      const inner = innerRef.current;
      const text = textRef.current;
      if (!inner || !text) return;
      const box = section.getBoundingClientRect();
      const cs = getComputedStyle(section);
      const innerBox = inner.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(inner).paddingLeft) || 0;
      setLayout(
        engine.measure({
          width: section.clientWidth,
          height: section.clientHeight,
          pxCss: parseFloat(cs.getPropertyValue("--px")) || 4,
          dpr: window.devicePixelRatio || 1,
          stacked: cs.getPropertyValue("--layout").trim() === "stacked",
          colLeft: innerBox.left - box.left + pad,
          colRight: innerBox.right - box.left - pad,
          text: (() => {
            const t = text.getBoundingClientRect();
            return { left: t.left - box.left, top: t.top - box.top, right: t.right - box.left, bottom: t.bottom - box.top };
          })(),
        }),
      );
    };
    measure();

    // The text box changes when the web fonts land, not only on resize.
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    if (textRef.current) ro.observe(textRef.current);

    // The hold (docs/HOME_SCROLL.md §4): the hero is sticky inside its
    // parent, the stretch of page it shares with the game card (page.tsx),
    // so it holds while the card rises over it and lets go when that stretch
    // ends. The hours to the next sky's resting picture run over exactly
    // that distance (scrollHour), so the scroll arrives on it as the scene
    // lets go.
    const hold = section.parentElement;
    let span = 1;
    const measureSpan = () => {
      span = Math.max(1, (hold?.offsetHeight ?? 0) - section.offsetHeight);
    };
    let p = 0;
    let raf = 0;
    let glow = "";
    const apply = () => {
      raf = 0;
      p = motionQ.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / span));
      section.style.setProperty("--scroll-p", p.toFixed(3));
      if (p > 0.28) section.dataset.faded = "";
      else delete section.dataset.faded;

      // The game card's hearth glows brighter as the sky darkens. It's set
      // on the hold, not <html>, so it leaves with the page
      // (docs/HOME_SCROLL.md §6).
      const hour = scrollHour(base, p);
      const next = (0.13 + 0.17 * darknessAt(hour)).toFixed(3); // 0.13 day · ~0.2 dusk · 0.3 night
      if (next !== glow) {
        glow = next;
        hold?.style.setProperty("--hearth-alpha", glow);
      }

      // data-sky follows the hour on screen: at rest it's the sky the
      // pre-paint script stamped; while scrolling it turns at the middle of a
      // blend, after the headline has gone.
      const sky = dominantSky(hour);
      if (document.documentElement.dataset.sky !== sky) document.documentElement.dataset.sky = sky;
      engine.setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const holdRo = new ResizeObserver(() => {
      measureSpan();
      apply();
    });
    holdRo.observe(section);
    if (hold) holdRo.observe(hold);
    measureSpan();
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();

    let onScreen = true;
    const wake = () => engine.setVisible(onScreen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      wake();
    });
    io.observe(section);
    document.addEventListener("visibilitychange", wake);

    const onScheme = () => engine.setScheme(darkQ.matches);
    const onMotion = () => {
      engine.setReduced(motionQ.matches);
      apply();
    };
    darkQ.addEventListener("change", onScheme);
    motionQ.addEventListener("change", onMotion);
    // Browser zoom changes devicePixelRatio without resizing the section.
    const dprQ = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQ.addEventListener("change", measure);

    // The visitor's clock moves on while the page is open (left open from
    // 12:50 to 13:10, say, it changes sky): move the scene to the new
    // starting hour, but only while nobody can see it. Otherwise try again
    // next minute.
    const clock = pinned
      ? 0
      : window.setInterval(() => {
          const next = startHour("");
          if (next === base || (onScreen && !document.hidden)) return;
          base = next;
          engine.setTime(base);
          apply();
        }, 60_000);

    return () => {
      ro.disconnect();
      navRo.disconnect();
      holdRo.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", wake);
      darkQ.removeEventListener("change", onScheme);
      motionQ.removeEventListener("change", onMotion);
      dprQ.removeEventListener("change", measure);
      window.clearInterval(clock);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Follow the stored apple. A regrowth (used → tree) plays; any change the
  // scene didn't start itself (another tab, the game) just snaps.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || apple === null) return;
    engine.show(apple, prevApple.current === "used" && apple === "tree");
    prevApple.current = apple;
  }, [apple, layout]);

  const hideWhisperSoon = useCallback(() => {
    window.clearTimeout(whisperTimer.current);
    whisperTimer.current = window.setTimeout(() => {
      if (!whisperHeld.current) setWhisper(false); // hovered or focused: wait for it to be let go
    }, WHISPER_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(whisperTimer.current), []);

  // A keyboard pick-up moves focus on to the whisper, since the button is gone.
  useEffect(() => {
    if (whisper && focusWhisper.current) {
      focusWhisper.current = false;
      whisperRef.current?.focus();
    }
  }, [whisper]);

  const onApple = (e: MouseEvent<HTMLButtonElement>) => {
    const engine = engineRef.current;
    if (!engine || falling) return;
    if (apple === "tree") {
      setFalling(engine.drop());
      writeApple("ground");
      setSaid("The apple fell into the grass.");
    } else if (apple === "ground") {
      // Enter or Space clicks with detail 0; a mouse or a tap counts its
      // clicks. Only a keyboard pick-up moves focus on (Chrome focuses a
      // clicked button too, so focus can't tell them apart).
      focusWhisper.current = e.detail === 0;
      engine.lift();
      writeApple("pocket");
      setSaid("You picked up the apple. The squire in the game below has it now.");
      setWhisper(true);
      hideWhisperSoon();
    }
  };

  const hold = (held: boolean) => {
    whisperHeld.current = held;
    if (!held) hideWhisperSoon();
  };

  // The button sits over the apple's spot, rim included: where it hangs,
  // or where it rests.
  let hit: { left: number; top: number; width: number; height: number } | null = null;
  if (layout && (apple === "tree" || apple === "ground")) {
    const at = apple === "tree" ? layout.apple : layout.rest;
    const r = toCss(layout, at.x - 1, at.y - 1, APPLE_W + 2, APPLE_H + 2);
    const w = Math.max(HIT_MIN, r.width + 8);
    const h = Math.max(HIT_MIN, r.height + 8);
    hit = { left: r.left + r.width / 2 - w / 2, top: r.top + r.height / 2 - h / 2, width: w, height: h };
  }

  const whisperAt = layout ? toCss(layout, layout.tree.cx, layout.tree.y - 3, 0, 0) : null;

  return (
    <section ref={sectionRef} className={styles.scene}>
      {TONES.map((s) => <div key={s} className={styles.probe} data-probe={s} hidden />)}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div ref={innerRef} className={styles.inner}>
        <div ref={textRef} className={styles.text}>
          {children}
        </div>
      </div>

      {hit && (
        <button
          type="button"
          className={styles.appleBtn}
          style={hit}
          aria-label={apple === "tree" ? "Pick the apple" : "Pick up the apple"}
          data-falling={falling || undefined}
          onClick={onApple}
          onPointerEnter={() => engineRef.current?.glint()}
        />
      )}

      {whisper && whisperAt && (
        <Link
          ref={whisperRef}
          href="/game"
          prefetch={false}
          className={styles.whisper}
          style={{ left: whisperAt.left, top: whisperAt.top }}
          onPointerEnter={() => hold(true)}
          onPointerLeave={() => hold(false)}
          onFocus={() => hold(true)}
          onBlur={() => hold(false)}
        >
          a squire could use this…<span className="visually-hidden"> Play To Arms, Squire!</span>
        </Link>
      )}

      <p className="visually-hidden" aria-live="polite">
        {said}
      </p>
    </section>
  );
}
