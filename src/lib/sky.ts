// src/lib/sky.ts
// The hero's sky follows the visitor's own clock. The inline script in the
// root layout stamps <html data-sky> before first paint, so CSS can colour
// the headline for the right sky with no flash, and the canvas starts in
// that sky, near the visitor's own time (startHour). Scrolling moves the hour
// forward to the next sky's resting picture (scrollHour; docs/HOME_SCROLL.md).
// `?sky=night` (etc.) overrides the clock.

export type Sky = "dawn" | "day" | "dusk" | "night";

/** Everything the engine can draw: the four skies, and golden hour, which
    the blends into dawn and dusk pass through but nothing ever rests on. */
export type Tone = Sky | "golden";

export const SKIES: readonly Sky[] = ["dawn", "day", "dusk", "night"];
export const TONES: readonly Tone[] = ["golden", "dawn", "day", "dusk", "night"];

export const BLEND_HOURS = 2;

/** The hour each sky is fully in; it blends in over the BLEND_HOURS before.
    Allen's hours (2026-10-19), which keep the changes to waking hours: dawn
    and dusk last four hours, day six, and night ten, across midnight. */
export const SKY_STARTS = { dawn: 8, day: 12, dusk: 18, night: 22 } as const;
/** Each sky's resting picture: its start, the moment its blend has just
    finished. `?sky=` shows it, it's the earliest a visit starts, and every
    scroll ends on the next one. */
export const SKY_HOUR: Record<Sky, number> = SKY_STARTS;
/** How far past its resting hour a visit can start, at most. */
export const REST_LATEST = 2;
/** The fewest hours a scroll covers. The next sky's blend fills a scroll's
    last BLEND_HOURS, and it must not begin before `p` = 1/3, after the
    headline has faded (`p` ≈ 0.29), so a visit starts at least this long
    before the next resting hour: dawn's and dusk's late starts stop at one
    hour. */
export const SCROLL_LEAST = BLEND_HOURS * 1.5;

/** The blends that pass through golden hour, keyed by the sky arriving. */
export const BRIDGE: Partial<Record<Sky, Tone>> = { dawn: "golden", dusk: "golden" };

// Dusk's sun rests half behind the hills (18:00), day's sun near the top
// (12:00, its highest at 12:30), night's moon high and climbing (22:00, its
// highest at 0:30), and dawn's sun just over the hills (8:00), an hour after
// it rose at golden hour's peak. Each sets an hour before the other rises,
// so they never share the sky.
export const SUN = { rise: 7, set: 18 };  // rises at dawn's golden peak, sets at dusk's rest
export const MOON = { rise: 19, set: 6 }; // gone before dawn's golden hour starts

export const hourNow = (d = new Date()): number => d.getHours() + d.getMinutes() / 60;

/** Where the hero's clock starts: the one place time is snapped. A visitor
    starts at their own time, held to their sky's resting hour or up to
    REST_LATEST after it, and SCROLL_LEAST before the next, so a visit never
    starts on a blend: at 17:30 the scene shows 18:00, at 18:40 18:40, from
    19:00 to 20:59 19:00, and from 0:00 to 6:59 0:00. */
export function startHour(search: string, now = hourNow()): number {
  const q = new URLSearchParams(search);
  const hour = q.get("hour");
  if (hour && Number.isFinite(Number(hour))) return normalizeHour(Number(hour)); // ?hour=: exactly that
  const pin = q.get("sky");
  if (pin && (SKIES as readonly string[]).includes(pin)) return SKY_HOUR[pin as Sky]; // ?sky=: that sky at rest
  const sky = dominantSky(now);
  const rest = SKY_HOUR[sky];
  const latest = Math.min(REST_LATEST, normalizeHour(SKY_HOUR[nextSky(sky)] - rest) - SCROLL_LEAST);
  const into = normalizeHour(now - rest); // 23.x in the hour before the rest, when the sky has already taken over
  return normalizeHour(rest + (into < 12 ? Math.min(into, latest) : 0));
}

/** The sky whose start came last: fully in, or blending into the next. Any
    sky can cross midnight (night does now), with no special case. */
export const skyForHour = (h: number): Sky =>
  SKIES.reduce((a, b) => (normalizeHour(h - SKY_STARTS[b]) < normalizeHour(h - SKY_STARTS[a]) ? b : a));

export const nextSky = (sky: Sky): Sky => SKIES[(SKIES.indexOf(sky) + 1) % SKIES.length];

/** The sky covering most of the scene: in a blend's first half the old
    sky, in its second the new one. It names a visit's resting sky,
    `data-sky` and (in the script below) the first paint. */
export const dominantSky = (hour: number): Sky => skyForHour(hour + BLEND_HOURS / 2);

/** The hour on screen, `p` (0..1) through the hold from `base`. A scroll
    runs to the next sky's resting picture, however far: four hours from
    dawn's rest, ten from night's. */
export function scrollHour(base: number, p: number): number {
  const span = normalizeHour(SKY_HOUR[nextSky(dominantSky(base))] - base);
  return normalizeHour(base + p * span);
}

export function darknessForSky(sky: Tone): number {
  if (sky === "golden") return 0.15; // between day's 0 and dusk's 0.4
  if (sky === "dusk") return 0.4;
  if (sky === "night") return 1;
  return 0;
}

/** The pre-paint script, built from the same hours and rule as dominantSky:
    the sky whose start came last, half a blend ahead. */
export const SKY_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get("sky");var d=new Date(),h=(d.getHours()+d.getMinutes()/60+${BLEND_HOURS / 2})%24,S=${JSON.stringify(SKY_STARTS)},s=q,b=24,k,t;if(!/^(dawn|day|dusk|night)$/.test(q||""))for(k in S){t=((h-S[k])%24+24)%24;if(t<b){b=t;s=k}}document.documentElement.dataset.sky=s}catch(e){}})()`;

/** f runs 0 (all `from`) to 1 (all `to`); outside a change, from === to. */
export type SkyMix = { from: Tone; to: Tone; f: number };

/** Which tones are on screen at `hour`, and how far between them. Each sky
    blends in over the BLEND_HOURS before its start; a blend into dawn or
    dusk passes through golden hour, the old sky turning golden in the
    first half and golden turning into the new sky in the second. */
export function skyMixAt(hour: number): SkyMix {
  const from = skyForHour(hour);
  const to = skyForHour(hour + BLEND_HOURS); // look ahead 2 hours to the next sky
  if (from === to) return { from, to, f: 0 };
  // How far through the window: the hours left until `to` is fully in,
  // over the window's length.
  const left = normalizeHour(SKY_STARTS[to] - hour);
  const f = 1 - left / BLEND_HOURS;
  const bridge = BRIDGE[to];
  if (bridge) return f < 0.5 ? { from, to: bridge, f: f * 2 } : { from: bridge, to, f: (f - 0.5) * 2 };
  return { from, to, f };
}

export function darknessAt(hour: number): number {
  const sky = skyMixAt(hour);
  return mix(darknessForSky(sky.from), darknessForSky(sky.to), sky.f);
}

export function mix(a: number, b: number, f: number): number {
  return a * (1 - f) + b * f;
}

export function normalizeHour(hour: number): number {
  return (hour % 24 + 24) % 24;
}

/** 0 at rise and set, 1 halfway between; below 0 while it's down, deepest
    halfway through its time down, so the curve has no jump anywhere. */
export function altitudeAt(hour: number, kind: "sun" | "moon"): number {
  hour = normalizeHour(hour);
  const { rise, set } = kind === "sun" ? SUN : MOON;
  const up = normalizeHour(set - rise);        // hours above the hills (13 for the sun)
  const since = normalizeHour(hour - rise);    // hours since it last rose
  if (since <= up) return Math.sin((Math.PI * since) / up);
  return -Math.sin((Math.PI * (since - up)) / (24 - up));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** How many of the stars show: none until golden hour's darkness, all at night's. */
export function starShare(darkness: number): number {
  return clamp01((darkness - 0.15) / 0.85);
}

/** The fireflies come out over the last third of the way to night's darkness. */
export function fireflyCount(darkness: number): number {
  return Math.round(8 * clamp01((darkness - 0.7) / 0.3));
}
