// src/components/font-picker/fonts.ts
// The font picker's catalog and the arithmetic behind it (FontPicker.tsx,
// /font-picker). Every family is on Google Fonts, so whichever wins goes in
// with one next/font/google import in app/layout.tsx. Styles, weights and
// axes are Google's own metadata (fonts.google.com/metadata/fonts, read
// 2026-10-12): the CSS API refuses a request for a style a family lacks.

/** The site's three font roles, the --font-* variables in globals.css. */
export type Slot = "display" | "body" | "mono";

export const SLOTS: readonly { id: Slot; label: string; what: string }[] = [
  { id: "display", label: "Headlines", what: "Titles, the name in the nav, card titles" },
  { id: "body", label: "Body", what: "Paragraphs, links and buttons" },
  { id: "mono", label: "Labels", what: "The small capitals: eyebrows, dates, stamps" },
];

export type Kind = "serif" | "sans" | "mono" | "pixel" | "display" | "handwriting";

export interface Family {
  name: string;
  kind: Kind;
  /** Upright weights. */
  w: number[];
  /** Italic weights. None means the browser slants the upright itself. */
  i?: number[];
  /** A variable font's weight axis. */
  wght?: [number, number];
  /** A variable font's optical-size axis (left off DM Sans, which the site
      loaded without it while it was the body face). */
  opsz?: [number, number];
  /** How the family comes in when picked by hand: the weight and size it
      looked right at on the page (screened 2026-10-12). Unlisted, headlines
      come in at 400, labels at 500 and everything at 100%. */
  best?: Partial<Record<Slot, { weight?: number; size?: number }>>;
}

/** One role's choice. `weight` is what every bit of that role renders at
    (every headline uses one weight, --weight-display; labels mostly use
    500, so one weight is a close preview; body text keeps the weights the
    page asks for). `size` scales the glyphs (CSS
    size-adjust), so a family with a small x-height or a wide set can be
    judged at a fair size. */
export interface Pick {
  family: string;
  weight: number;
  size: number;
}

export type Picks = Record<Slot, Pick>;

export interface Pairing {
  id: string;
  name: string;
  blurb: string;
  picks: Picks;
  /** The pairing the site is set in (app/layout.tsx). */
  live?: boolean;
}

const KIND_LABELS: Record<Kind, string> = {
  serif: "Serif",
  sans: "Sans",
  mono: "Mono",
  pixel: "Pixel",
  display: "Display",
  handwriting: "Handwriting",
};
export const kindLabel = (k: Kind) => KIND_LABELS[k];

export const FAMILIES: readonly Family[] = [
  { name: "Vollkorn", kind: "serif", w: [400, 500, 600, 700, 800, 900], i: [400, 500, 600, 700, 800, 900], wght: [400, 900], best: { display: { weight: 600 } } },
  // Wider than DM Serif Display: at 85% the headline still fits one line.
  { name: "Besley", kind: "serif", w: [400, 500, 600, 700, 800, 900], i: [400, 500, 600, 700, 800, 900], wght: [400, 900], best: { display: { weight: 600, size: 0.85 } } },
  { name: "Zilla Slab", kind: "serif", w: [300, 400, 500, 600, 700], i: [300, 400, 500, 600, 700], best: { display: { weight: 600 } } },
  { name: "Young Serif", kind: "serif", w: [400], best: { display: { size: 0.88 } } },
  { name: "IM Fell English", kind: "serif", w: [400], i: [400] },
  { name: "Literata", kind: "serif", w: [200, 300, 400, 500, 600, 700, 800, 900], i: [200, 300, 400, 500, 600, 700, 800, 900], wght: [200, 900], opsz: [7, 72], best: { display: { weight: 500, size: 0.95 }, body: { size: 0.97 } } },
  { name: "Grenze", kind: "serif", w: [100, 200, 300, 400, 500, 600, 700, 800, 900], i: [100, 200, 300, 400, 500, 600, 700, 800, 900], wght: [100, 900], best: { display: { weight: 600, size: 1.05 } } },
  { name: "Alegreya", kind: "serif", w: [400, 500, 600, 700, 800, 900], i: [400, 500, 600, 700, 800, 900], wght: [400, 900], best: { display: { weight: 500 } } },
  { name: "Brygada 1918", kind: "serif", w: [400, 500, 600, 700], i: [400, 500, 600, 700], wght: [400, 700], best: { display: { weight: 600 } } },
  { name: "Castoro", kind: "serif", w: [400], i: [400] },
  { name: "Crete Round", kind: "serif", w: [400], i: [400] },
  { name: "DM Serif Display", kind: "serif", w: [400], i: [400] },

  { name: "Karla", kind: "sans", w: [200, 300, 400, 500, 600, 700, 800], i: [200, 300, 400, 500, 600, 700, 800], wght: [200, 800], best: { body: { size: 1.03 } } },
  { name: "Libre Franklin", kind: "sans", w: [100, 200, 300, 400, 500, 600, 700, 800, 900], i: [100, 200, 300, 400, 500, 600, 700, 800, 900], wght: [100, 900], best: { body: { size: 0.97 } } },
  { name: "Atkinson Hyperlegible Next", kind: "sans", w: [200, 300, 400, 500, 600, 700, 800], i: [200, 300, 400, 500, 600, 700, 800], wght: [200, 800] },
  { name: "Schibsted Grotesk", kind: "sans", w: [400, 500, 600, 700, 800, 900], i: [400, 500, 600, 700, 800, 900], wght: [400, 900], best: { body: { size: 0.98 } } },
  { name: "Proza Libre", kind: "sans", w: [400, 500, 600, 700, 800], i: [400, 500, 600, 700, 800], best: { body: { size: 0.98 } } },
  { name: "Mona Sans", kind: "sans", w: [200, 300, 400, 500, 600, 700, 800, 900], i: [200, 300, 400, 500, 600, 700, 800, 900], wght: [200, 900] },
  { name: "Source Sans 3", kind: "sans", w: [200, 300, 400, 500, 600, 700, 800, 900], i: [200, 300, 400, 500, 600, 700, 800, 900], wght: [200, 900], best: { body: { size: 1.03 } } },
  { name: "Alegreya Sans", kind: "sans", w: [100, 300, 400, 500, 700, 800, 900], i: [100, 300, 400, 500, 700, 800, 900], best: { body: { size: 1.08 } } },
  { name: "Cabin", kind: "sans", w: [400, 500, 600, 700], i: [400, 500, 600, 700], wght: [400, 700], best: { body: { size: 1.02 } } },
  { name: "Familjen Grotesk", kind: "sans", w: [400, 500, 600, 700], i: [400, 500, 600, 700], wght: [400, 700] },
  { name: "DM Sans", kind: "sans", w: [100, 200, 300, 400, 500, 600, 700, 800, 900], i: [100, 200, 300, 400, 500, 600, 700, 800, 900], wght: [100, 1000] },

  { name: "Sometype Mono", kind: "mono", w: [400, 500, 600, 700], i: [400, 500, 600, 700], wght: [400, 700], best: { mono: { size: 1.05 } } },
  // Its capitals are small (0.58 of the size; DM Mono's are 0.70).
  { name: "Courier Prime", kind: "mono", w: [400, 700], i: [400, 700], best: { mono: { weight: 700, size: 1.15 } } },
  { name: "Atkinson Hyperlegible Mono", kind: "mono", w: [200, 300, 400, 500, 600, 700, 800], i: [200, 300, 400, 500, 600, 700, 800], wght: [200, 800] },
  { name: "Red Hat Mono", kind: "mono", w: [300, 400, 500, 600, 700], i: [300, 400, 500, 600, 700], wght: [300, 700] },
  { name: "Special Elite", kind: "mono", w: [400] },
  { name: "Chivo Mono", kind: "mono", w: [100, 200, 300, 400, 500, 600, 700, 800, 900], i: [100, 200, 300, 400, 500, 600, 700, 800, 900], wght: [100, 900] },
  { name: "Ubuntu Sans Mono", kind: "mono", w: [400, 500, 600, 700], i: [400, 500, 600, 700], wght: [400, 700] },
  { name: "Xanh Mono", kind: "mono", w: [400], i: [400], best: { mono: { size: 1.1 } } },
  { name: "B612 Mono", kind: "mono", w: [400, 700], i: [400, 700], best: { mono: { size: 0.94 } } },
  { name: "DM Mono", kind: "mono", w: [300, 400, 500], i: [300, 400, 500] },

  { name: "Pixelify Sans", kind: "pixel", w: [400, 500, 600, 700], wght: [400, 700], best: { display: { weight: 500 } } },
  { name: "Silkscreen", kind: "pixel", w: [400, 700], best: { mono: { size: 0.92 } } },
  { name: "Jersey 10", kind: "pixel", w: [400] },
  { name: "VT323", kind: "pixel", w: [400] },
];

const pick = (family: string, weight = 400, size = 1): Pick => ({ family, weight, size });

/** The shortlist, best fit first. Each was screened on the home page, the
    game card, the work cards and a case study's prose before it got here;
    Allen picked Storybook on 2026-10-13. */
export const PAIRINGS: readonly Pairing[] = [
  {
    id: "storybook",
    name: "Storybook",
    blurb: "A dark, warm book serif with a friendly sans. The easiest fit for the paper, the tree and the game.",
    // As the site sets it: Karla at its own size, and the labels' 5% in
    // --text-label (12px) rather than here. Screened at 103% and 105%.
    picks: { display: pick("Vollkorn", 600), body: pick("Karla"), mono: pick("Sometype Mono", 500) },
    live: true,
  },
  {
    id: "broadside",
    name: "Broadside",
    blurb: "An old printed poster: Clarendon headlines, a newspaper sans, typewriter stamps. Leans into the ink rules and hard shadows.",
    picks: { display: pick("Besley", 600, 0.85), body: pick("Libre Franklin", 400, 0.97), mono: pick("Courier Prime", 700, 1.15) },
  },
  {
    id: "workshop",
    name: "Workshop",
    blurb: "Mozilla's sturdy slab with the Braille Institute's hyperlegible sans. The most technical of the six, and the easiest to read.",
    picks: { display: pick("Zilla Slab", 600), body: pick("Atkinson Hyperlegible Next"), mono: pick("Atkinson Hyperlegible Mono", 500) },
  },
  {
    id: "cozy",
    name: "Cozy",
    blurb: "A heavy, soft old-style serif, chunky enough to stand next to the pixels. It has no italic, so the browser slants “Allen”.",
    picks: { display: pick("Young Serif", 400, 0.88), body: pick("Schibsted Grotesk", 400, 0.98), mono: pick("Red Hat Mono", 500) },
  },
  {
    id: "old-book",
    name: "Old Book",
    blurb: "Revived from 17th-century Oxford printing, uneven ink and all, with worn typewriter labels. The most daring of the serifs.",
    picks: { display: pick("IM Fell English"), body: pick("Proza Libre", 400, 0.98), mono: pick("Special Elite") },
  },
  {
    id: "pixel",
    name: "Pixel",
    blurb: "Headlines and labels in pixel type, all in on the diorama. The loudest: card titles start to read like a game.",
    picks: { display: pick("Pixelify Sans", 500), body: pick("Mona Sans"), mono: pick("Silkscreen", 400, 0.92) },
  },
  {
    id: "before",
    name: "Before",
    blurb: "The DM family the site used until 2026-10-13.",
    picks: { display: pick("DM Serif Display"), body: pick("DM Sans"), mono: pick("DM Mono", 500) },
  },
];

/** The weights a role can be set to. */
export function weightsFor(f: Family | undefined): number[] {
  if (!f) return [400];
  if (!f.wght) return f.w;
  const out: number[] = [];
  for (let w = Math.ceil(f.wght[0] / 100) * 100; w <= Math.min(900, f.wght[1]); w += 100) out.push(w);
  return out;
}

function nearest(ws: number[], want: number): number {
  return ws.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a), ws[0] ?? 400);
}

export function hasItalic(f: Family | undefined, weight: number): boolean {
  if (!f?.i?.length) return false;
  return f.wght ? true : f.i.includes(weight);
}

/** A family as it comes in for a role: its best weight and size there. */
export function defaultPick(f: Family, slot: Slot): Pick {
  const best = f.best?.[slot];
  const weight = slot === "body" ? 400 : nearest(weightsFor(f), best?.weight ?? (slot === "mono" ? 500 : 400));
  return { family: f.name, weight, size: best?.size ?? 1 };
}

/** The Google Fonts CSS API request for a pick: headlines and labels load
    their one weight (so every heading renders at it, whatever weight the
    site's CSS asks for), body text the 300 to 700 the site uses. */
export function cssUrl(slot: Slot, p: Pick, f: Family | undefined): string {
  const family = p.family.trim().replace(/ +/g, "+");
  let spec = "";
  if (f) {
    const opsz = f.opsz ? `${f.opsz[0]}..${f.opsz[1]}` : null;
    let up: string[];
    let it: string[];
    if (slot !== "body") {
      up = [String(p.weight)];
      it = hasItalic(f, p.weight) ? up : [];
    } else if (f.wght) {
      const lo = Math.max(300, f.wght[0]);
      const hi = Math.min(700, f.wght[1]);
      up = [lo === hi ? String(lo) : `${lo}..${hi}`];
      it = f.i?.length ? up : [];
    } else {
      const inRange = (ws: number[]) => ws.filter((w) => w >= 300 && w <= 700).map(String);
      up = inRange(f.w);
      if (!up.length) up = [String(nearest(f.w, 400))];
      it = inRange(f.i ?? []);
    }
    const single = f.w.length === 1 && !f.i?.length && !opsz && f.w[0] === 400;
    if (!single) {
      const axes = [it.length ? "ital" : null, opsz ? "opsz" : null, "wght"].filter(Boolean).join(",");
      const tuple = (ital: number | null, w: string) => [ital, opsz, w].filter((x) => x !== null).join(",");
      const tuples = it.length ? [...up.map((w) => tuple(0, w)), ...it.map((w) => tuple(1, w))] : up.map((w) => tuple(null, w));
      spec = `:${axes}@${tuples.join(";")}`;
    }
  }
  return `https://fonts.googleapis.com/css2?family=${family}${spec}&display=swap`;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** The name a pick's faces are loaded under: one per family, weight and
    size, so switching back and forth never reloads anything. */
export function aliasFor(slot: Slot, p: Pick): string {
  return `fp-${hash(`${p.family}|${slot === "body" ? "body" : p.weight}|${p.size}`)}`;
}

/** Google's @font-face rules, renamed to the alias and scaled. */
export function faceCss(css: string, alias: string, size: number): string {
  const adjust = Math.abs(size - 1) > 0.001 ? ` size-adjust: ${Math.round(size * 1000) / 10}%;` : "";
  return css.replace(/font-family:\s*['"][^'"]+['"];/g, `font-family: '${alias}';${adjust}`);
}

export function samePicks(a: Picks, b: Picks): boolean {
  return SLOTS.every(({ id }) =>
    a[id].family === b[id].family &&
    Math.abs(a[id].size - b[id].size) < 0.001 &&
    (id === "body" || a[id].weight === b[id].weight));
}

/** One line to paste back: what to wire into app/layout.tsx. */
export function summary(picks: Picks, pairing?: Pairing): string {
  const part = (slot: Slot) => {
    const p = picks[slot];
    const size = Math.abs(p.size - 1) > 0.001 ? ` at ${Math.round(p.size * 100)}%` : "";
    return `${p.family}${slot === "body" ? "" : ` ${p.weight}`}${size}`;
  };
  const line = `headlines ${part("display")}, body ${part("body")}, labels ${part("mono")}`;
  return pairing ? `${pairing.name}: ${line}` : `My mix: ${line}`;
}
