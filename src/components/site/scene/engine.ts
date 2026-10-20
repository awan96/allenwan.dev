// src/components/site/scene/engine.ts
// The hero diorama's canvas: layers, the clock, and the apple's motion.
// HeroScene owns the DOM and the apple contract; this owns the pixels.
//
// The scene is drawn one scene pixel per canvas pixel into small offscreen
// canvases, then scaled up by a whole number of device pixels, so every
// pixel stays square and crisp at any devicePixelRatio. Things that never
// move (sky, hills, ground, tree) are drawn once per resize into two cached
// layers per tone; inside a blend, two tones' layers are mixed through a
// Bayer dither. A frame is those layers, the sun and the moon, and a few
// dozen moving pixels. The hour comes from the visitor's clock and the
// scroll (setTime, setProgress; docs/HOME_SCROLL.md). The loop runs at
// ~30fps, only while the scene is on screen and the tab is visible, and
// not at all under reduced motion.
//
// Every time here comes from performance.now(). The rAF callback's own
// timestamp is when the frame began, which can be earlier than a start
// time stamped moments before in show() or lift(); mixing the two once
// gave a regrowth a frame index of -1.

import type { AppleState } from "@/lib/apple";
import { normalizeHour, altitudeAt, darknessAt, fireflyCount, hourNow, scrollHour, skyMixAt, starShare, type Tone } from "@/lib/sky";
import { ICON_ROLES, PALETTE } from "@/components/pixel/siteSprites";
import { APPLE, APPLE_TURNS, GROW_FRAMES, dropFrom, stepApple, turnOf, type AppleBody } from "./apple";
import { computeLayout, TREE, type Measure, type SceneLayout } from "./layout";
import { sceneColors, APPLE_RIM, orbitalColors } from "./palettes";
import {
  bandEdges, BAYER, drawClouds, drawFlies, drawGrass, drawHills, drawOutline, drawRootTufts, drawSky, drawSoil,
  drawSpark, drawSprite, drawStars, drawSun, makeClouds, makeFlies, makeStars, type Cloud, type Fly, type Star,
} from "./draw";

/** What the CSS owns and the canvas reads back (see HeroScene.module.css). */
export type CssColors = { bands: string[]; soil: { base: string; light: string; dark: string } };

/** What the scene is showing of the apple, which can lag the stored state
    while a fall, a pick-up or a regrowth plays out. */
type AppleView =
  | { kind: "none" }
  | { kind: "hang" }
  | { kind: "grow"; start: number }
  | { kind: "fall"; body: AppleBody }
  | { kind: "rest"; x: number; y: number }
  | { kind: "lift"; start: number; x: number; y: number };

type Layer = { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
type Layers = { back: Layer; front: Layer; clouds: Cloud[] };

const FRAME_MS = 33;
const GLINT_LEN = 0.3;
const GROW_STEP_MS = 150;
const LIFT_STEP_MS = 45;

/** A repeating 4×4 stencil, opaque where BAYER < k (or, inverse, where
    it isn't): k of every 16 pixels. */
function tilePattern(k: number, inverse = false): CanvasPattern {
  const t = layer(4, 4);
  t.ctx.fillStyle = "#000";
  for (let i = 0; i < 16; i++) {
    if ((BAYER[i] < k) !== inverse) {
      // i & 3 is the x, i >> 2 is the y
      t.ctx.fillRect(i & 3, i >> 2, 1, 1);
    }
  }
  return t.ctx.createPattern(t.c, "repeat")!;
}

/** Whole steps of `every` ms in `elapsed`, held to 0..max. */
function clampStep(elapsed: number, every: number, max: number) {
  return Math.max(0, Math.min(max, Math.floor(elapsed / every)));
}

function layer(w: number, h: number): Layer {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

export class SceneEngine {
  private ctx: CanvasRenderingContext2D;
  private l: SceneLayout | null = null;
  private frame = layer(1, 1);
  private stars: Star[] = [];
  private flies: Fly[] = [];
  private view: AppleView = { kind: "none" };
  private visible = true;
  private raf = 0;
  private lastFrame = 0;
  private lastStep = 0;
  private t0 = performance.now();
  private glintAt = -1;
  private cache = new Map<Tone, Layers>();
  private backMix = layer(1, 1);
  private frontMix = layer(1, 1);
  private cloudA = layer(1, 1);
  private cloudB = layer(1, 1);
  private cloudMix = layer(1, 1);
  private tmp = layer(1, 1);
  private mixKey = "";
  private baseHour = hourNow();
  private hour = hourNow();
  private progress = 0;
  private dither: Array<CanvasPattern> | null = null;
  private inverse: Array<CanvasPattern> | null = null;

  /** Called when a fall ends, whether it came to rest or was cut short by
      a resize or reduced motion: the page keeps the apple's focus ring
      hidden until the apple is where the ring is. */
  onSettle: (() => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private dark: boolean,
    private reduced: boolean,
    private readCss: (sky: Tone) => CssColors,
  ) {
    this.ctx = canvas.getContext("2d")!;
  }

  /** Re-fit to the section; returns the new layout for the DOM overlay. */
  measure(m: Measure): SceneLayout {
    const l = computeLayout(m);
    this.l = l;
    this.canvas.width = l.W * l.p;
    this.canvas.height = l.H * l.p;
    this.canvas.style.width = `${l.W * l.px}px`;
    this.canvas.style.height = `${l.H * l.px}px`;
    this.frame = layer(l.W, l.H);
    // The mixes and their scratch layer match the scene, and the cached
    // skies are about to be redrawn, so the current mix is stale too.
    this.backMix = layer(l.W, l.H);
    this.frontMix = layer(l.W, l.H);
    this.cloudA = layer(l.W, l.H);
    this.cloudB = layer(l.W, l.H);
    this.cloudMix = layer(l.W, l.H);
    this.tmp = layer(l.W, l.H);
    this.mixKey = "";
    this.stars = makeStars(l, "many");
    this.flies = makeFlies(l);
    // A resting apple stays at the spot this layout's fall would reach.
    if (this.view.kind === "rest" || this.view.kind === "fall") this.setView(this.resting(l));
    this.cache.clear();
    this.paint();
    this.sync();
    return l;
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced;
    if (reduced) this.settle();
    this.paint();
    this.sync();
  }

  setScheme(dark: boolean) {
    if (dark === this.dark) return;
    this.cache.clear();
    this.mixKey = "";
    this.dark = dark;
    this.paint();
    this.sync();
  }

  setTime(hour: number) {
    this.baseHour = normalizeHour(hour);
    this.retime();
  }

  /** 0..1 through the hold (HeroScene). Nothing ever covers the scene: it
      scrolls away when the hold ends, and the IntersectionObserver then puts
      the loop to sleep through setVisible. */
  setProgress(progress: number) {
    this.progress = progress;
    this.retime();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.sync();
  }

  private retime() {
    this.hour = scrollHour(this.baseHour, this.progress);
    this.paint();
  }

  /** Match the stored state. `grow` plays the regrowth instead of popping in. */
  show(state: AppleState | null, grow = false) {
    const k = this.view.kind;
    if (state === "tree") {
      if (k === "hang" || k === "grow") return;
      this.setView(grow && !this.reduced ? { kind: "grow", start: performance.now() } : { kind: "hang" });
    } else if (state === "ground") {
      if (k === "fall" || k === "rest") return;
      if (this.l) this.setView(this.resting(this.l));
    } else if (k !== "lift") {
      this.setView({ kind: "none" });
    }
    this.paint();
    this.sync();
  }

  /** The apple lets go of the twig. True when a fall plays out (onSettle
      follows); false when it lands at once, under reduced motion. */
  drop(): boolean {
    if (!this.l) return false;
    const falls = !this.reduced;
    this.setView(falls ? { kind: "fall", body: dropFrom(this.l.apple) } : this.resting(this.l));
    this.lastStep = performance.now();
    this.paint();
    this.sync();
    return falls;
  }

  /** The apple leaves the grass, picked up (SquireApple takes it from here). */
  lift() {
    const v = this.view;
    if (v.kind !== "rest" || this.reduced) {
      this.setView({ kind: "none" });
    } else {
      this.setView({ kind: "lift", start: performance.now(), x: v.x, y: v.y });
    }
    this.paint();
    this.sync();
  }

  /** A glint on demand (the pointer found the apple). */
  glint() {
    if (this.reduced || this.view.kind !== "hang") return;
    const t = (performance.now() - this.t0) / 1000;
    if (this.glintAt < 0 || t - this.glintAt > GLINT_LEN) this.glintAt = t;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  // ---- internals ----

  private resting(l: SceneLayout): AppleView {
    return { kind: "rest", x: l.rest.x, y: l.rest.y };
  }

  private setView(next: AppleView) {
    const fell = this.view.kind === "fall" && next.kind !== "fall";
    this.view = next;
    if (fell) this.onSettle?.();
  }

  private settle() {
    const v = this.view;
    if (v.kind === "fall" && this.l) this.setView(this.resting(this.l));
    else if (v.kind === "grow") this.setView({ kind: "hang" });
    else if (v.kind === "lift") this.setView({ kind: "none" });
  }

  /** `a` into `dst` with k of every 16 pixels of `b` laid over it through
      the Bayer stencil (HOME_SCROLL.md §3.2). `sparse` also cuts `a` where
      `b` will land, for layers that are mostly see-through (clouds). */
  private mixLayers(dst: Layer, a: Layer, b: Layer, k: number, tmp: Layer, sparse = false) {
    const dither = this.dither ??= Array.from({ length: 17 }, (_, k) => tilePattern(k));
    const inverse = this.inverse ??= Array.from({ length: 17 }, (_, k) => tilePattern(k, true));
    const { width: W, height: H } = dst.c;
    dst.ctx.clearRect(0, 0, W, H);
    dst.ctx.drawImage(a.c, 0, 0);
    if (sparse && k > 0) { // keep `from` only where `to` won't be
      dst.ctx.globalCompositeOperation = "destination-in";
      dst.ctx.fillStyle = inverse[k];
      dst.ctx.fillRect(0, 0, W, H);
      dst.ctx.globalCompositeOperation = "source-over";
    }
    if (k === 0) return;
    tmp.ctx.clearRect(0, 0, W, H);
    tmp.ctx.drawImage(b.c, 0, 0);
    tmp.ctx.globalCompositeOperation = "destination-in";
    tmp.ctx.fillStyle = dither[k];
    tmp.ctx.fillRect(0, 0, W, H);
    tmp.ctx.globalCompositeOperation = "source-over";
    dst.ctx.drawImage(tmp.c, 0, 0);
  }

  /** One tone's two layers and its clouds, drawn the first time they're
      asked for and kept until a resize or a scheme change empties the
      cache. */
  private layersFor(sky: Tone): Layers {
    const hit = this.cache.get(sky);
    if (hit) return hit;
    const l = this.l!;
    const css = this.readCss(sky);
    const c = sceneColors(sky, this.dark);

    const back = layer(l.W, l.H);
    drawSky(back.ctx, l.W, bandEdges(l), css.bands, l.text);

    const front = layer(l.W, l.H);
    drawHills(front.ctx, l, c.hills.far, c.hills.near);
    // Grass and tree take the sky's tint; the soil below the ink line
    // doesn't, since it's the base the whole diorama stands on.
    const living = layer(l.W, l.H);
    drawGrass(living.ctx, l, c.flowers);
    drawSprite(living.ctx, TREE, ICON_ROLES.apple_tree, PALETTE, l.tree.x, l.tree.y);
    drawRootTufts(living.ctx, l);
    if (c.tint) {
      living.ctx.globalCompositeOperation = "source-atop";
      living.ctx.fillStyle = c.tint;
      living.ctx.fillRect(0, 0, l.W, l.H);
      living.ctx.globalCompositeOperation = "source-over";
    }
    front.ctx.drawImage(living.c, 0, 0);
    drawSoil(front.ctx, l, css.soil);
    const clouds = c.clouds ? makeClouds(l, c.clouds) : [];
    const layers = { back, front, clouds };
    this.cache.set(sky, layers);
    return layers;
  }

  private layersAt(hour: number): { back: Layer; front: Layer } {
    const { from, to, f } = skyMixAt(hour);
    if (from === to) return this.layersFor(from);
    const k = Math.round(f * 16);
    // The words never sit on a mix: every visit rests outside the windows,
    // and the headline has faded before the first one (HOME_SCROLL.md §3.2).
    const key = `${from}>${to}>${k}`;
    if (key !== this.mixKey) {
      const a = this.layersFor(from), b = this.layersFor(to);
      this.mixLayers(this.backMix, a.back, b.back, k, this.tmp);
      this.mixLayers(this.frontMix, a.front, b.front, k, this.tmp);
      this.mixKey = key;
    }
    return { back: this.backMix, front: this.frontMix };
  }

  /** Run the loop only when something could move and someone could see it. */
  private sync() {
    const want = !this.reduced && this.visible && !!this.l;
    if (want && !this.raf) {
      this.lastFrame = 0;
      this.lastStep = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else if (!want && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now();
    if (now - this.lastFrame < FRAME_MS - 2) return;
    this.lastFrame = now;
    this.advance(now);
    this.paint(now);
  };

  /** Step the apple's motion on a fixed clock, whatever the frame rate. */
  private advance(now: number) {
    const v = this.view;
    if (v.kind === "fall" && this.l) {
      let steps = clampStep(now - this.lastStep, FRAME_MS, 4);
      this.lastStep += steps * FRAME_MS;
      while (steps-- > 0 && !v.body.done) stepApple(v.body, this.l.surface);
      if (v.body.done) this.setView(this.resting(this.l));
    } else {
      this.lastStep = now;
    }
    if (v.kind === "grow" && now - v.start >= GROW_STEP_MS * GROW_FRAMES.length) this.setView({ kind: "hang" });
    if (v.kind === "lift" && now - v.start >= LIFT_STEP_MS * 8) this.setView({ kind: "none" });
  }

  private row(alt: number): number {
    const l = this.l!;
    return Math.round(l.lowSun.y - (l.lowSun.y - l.sun.y) * alt);
  }
  /** The disc's column. Most layouts give the low and high spots one
      column. When the low spot had to move to the tree's far side (no room
      right of the apple), the disc stays there until 0.3 of the way up, so
      a sun just over the hills (dawn's rest) stays clear of the canopy,
      then crosses behind the canopy to the high column, there by 0.6. */
  private sunX(alt: number): number {
    const l = this.l!;
    const s = Math.max(0, Math.min(1, (alt - 0.3) / 0.3));
    return Math.round(l.lowSun.x + (l.sun.x - l.lowSun.x) * s);
  }
  private moonX(alt: number): number {
    return this.sunX(alt);
  }

  private paint(now = performance.now()) {
    const l = this.l;
    if (!l) return;
    const still = this.reduced;
    const t = (now - this.t0) / 1000;
    const f = this.frame.ctx;
    const d = darknessAt(this.hour);
    const { back, front } = this.layersAt(this.hour);
    f.clearRect(0, 0, l.W, l.H);
    f.drawImage(back.c, 0, 0);
    if (this.stars.length) drawStars(f, this.stars, t, still, starShare(d));
    const sun = altitudeAt(this.hour, "sun"), moon = altitudeAt(this.hour, "moon");
    // The sun wears the colours of the tone the scene is nearer, golden
    // hour's own for the middle hour of a golden window; the moon, night's.
    const sky = skyMixAt(this.hour);
    const tone = sky.f < 0.5 ? sky.from : sky.to;
    const { sun: sunColors, moon: moonColors } = orbitalColors(this.hour, tone, this.dark);
    if (sun > -0.3) drawSun(f, this.sunX(sun), this.row(sun), sunColors);
    if (moon > -0.3) drawSun(f, this.moonX(moon), this.row(moon), moonColors);

    this.paintClouds(f, l, this.hour, still ? 0 : t);
    f.drawImage(front.c, 0, 0);
    this.paintApple(f, l, t, now);
    if (this.flies.length) drawFlies(f, this.flies.slice(0, fireflyCount(d)), t, still);

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.frame.c, 0, 0, l.W * l.p, l.H * l.p);
  }

  private paintClouds(f: CanvasRenderingContext2D, l: SceneLayout, hour: number, ct: number) {
    const { from, to, f: mixf } = skyMixAt(hour);
    const A = this.layersFor(from).clouds;
    if (from === to) {
      drawClouds(f, A, l.W, ct);
      return;
    }
    const B = this.layersFor(to).clouds;
    if (A.length === 0 && B.length === 0) return;
    this.cloudA.ctx.clearRect(0, 0, l.W, l.H);
    drawClouds(this.cloudA.ctx, A, l.W, ct);
    this.cloudB.ctx.clearRect(0, 0, l.W, l.H);
    drawClouds(this.cloudB.ctx, B, l.W, ct);
    this.mixLayers(this.cloudMix, this.cloudA, this.cloudB, Math.round(mixf * 16), this.tmp, true);
    f.drawImage(this.cloudMix.c, 0, 0);
  }

  private paintApple(f: CanvasRenderingContext2D, l: SceneLayout, t: number, now: number) {
    const v = this.view;
    const roles = ICON_ROLES.apple;
    const rim = APPLE_RIM;
    const twig = () => {
      f.fillStyle = PALETTE.barkDark;
      f.fillRect(l.twig.x, l.twig.top, 1, l.twig.bottom - l.twig.top + 1);
    };
    // The rim first, so the twig and a resting apple's shadow sit over it.
    const body = (grid: string[], x: number, y: number, palette: Record<string, string> = PALETTE, under?: () => void) => {
      drawOutline(f, grid, x, y, rim);
      under?.();
      drawSprite(f, grid, roles, palette, x, y);
    };

    if (v.kind === "hang") {
      // No glint of its own, so it stays an easter egg: it sparks only when
      // the pointer finds it.
      const on = !this.reduced && this.glintAt >= 0 && t - this.glintAt < GLINT_LEN;
      body(APPLE, l.apple.x, l.apple.y, PALETTE, twig);
      if (on) drawSpark(f, l.apple.x + 6, l.apple.y + 1, (t - this.glintAt) / GLINT_LEN);
    } else if (v.kind === "grow") {
      const i = clampStep(now - v.start, GROW_STEP_MS, GROW_FRAMES.length - 1);
      body(GROW_FRAMES[i], l.apple.x, l.apple.y, PALETTE, twig);
    } else if (v.kind === "fall") {
      const b = v.body;
      body(APPLE_TURNS[turnOf(b.rolled, l.rest.rolled)], Math.round(b.x), Math.round(b.y));
    } else if (v.kind === "rest") {
      body(APPLE, v.x, v.y, PALETTE, () => this.shadow(f, l, v.x));
    } else if (v.kind === "lift") {
      // Up off the grass in four quick steps, then a spark where it was.
      const step = clampStep(now - v.start, LIFT_STEP_MS, 8);
      if (step < 4) body(APPLE, v.x, v.y - step * 2);
      else drawSpark(f, v.x + 3, v.y - 6, (step - 4) / 4);
    }
  }

  /** A short shadow on the grass under a resting apple: it separates the
      apple's dark underside from the green by lightness, not hue. */
  private shadow(f: CanvasRenderingContext2D, l: SceneLayout, x: number) {
    f.fillStyle = PALETTE.pine;
    for (let dx = 1; dx < 5; dx++) {
      const cx = Math.min(l.W - 1, x + dx);
      f.fillRect(cx, l.surface[cx] + 1, 1, 1);
    }
  }
}

