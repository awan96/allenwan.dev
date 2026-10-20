// src/components/site/scene/palettes.ts
// The colours of things in the diorama, per sky (golden hour included) and
// per colour scheme. The sky's own bands and the headline colours live in
// HeroScene.module.css, because they have to paint before the canvas
// mounts; the canvas reads the bands back from there, so each colour lives
// in one place.
//
// Every colour that can sit behind the hero text (clouds included) was
// checked against that sky's text colours: body text at 4.5:1 or better.
// In the dark colour scheme every sky is a dimmed one, so nothing glares
// next to a dark page.

import type { Tone } from "@/lib/sky";
import { PALETTE } from "@/components/pixel/siteSprites";

export type SceneColors = {
  clouds: { body: string; belly: string } | null;
  /** The disc's colours. Where it sits comes from the hour (sky.ts altitudeAt). */
  sun: { kind: "sun" | "moon"; core: string; rim: string; halo: string };
  hills: { far: string; near: string };
  flowers: boolean;
  /** Laid over the grass and tree (never the soil, the diorama's base). */
  tint: string | null;
};

const LIGHT: Record<Tone, SceneColors> = {
  dawn: {
    clouds: { body: "#fff4ec", belly: "#ecc6c3" },
    sun: { kind: "sun", core: "#fff3d6", rim: "#f9d49a", halo: "#f6dcc6" },
    hills: { far: "#d4bcc6", near: "#c0a8b9" },
    flowers: true,
    tint: "rgba(110, 60, 90, 0.10)",
  },
  day: {
    clouds: { body: "#fbfaf5", belly: "#dce8ea" },
    sun: { kind: "sun", core: "#fff7dc", rim: "#f6e3a1", halo: "#d4e6e2" },
    hills: { far: "#b4d3c4", near: "#9fc6b1" },
    flowers: true,
    tint: null,
  },
  dusk: {
    clouds: { body: "#4d3a5e", belly: "#5e4468" },
    sun: { kind: "sun", core: "#ffd08a", rim: "#f39a5b", halo: "#b85f63" },
    hills: { far: "#4a3452", near: "#3a2944" },
    flowers: false,
    tint: "rgba(40, 20, 60, 0.32)",
  },
  night: {
    clouds: null,
    sun: { kind: "moon", core: "#f1ead2", rim: "#cfc7ab", halo: "#1f2d45" },
    hills: { far: "#1c2b37", near: "#16222a" },
    flowers: false,
    tint: "rgba(8, 14, 32, 0.46)",
  },
  golden: {
    clouds: { body: "#f0caab", belly: "#e1927e" },  // sunlit peach, a salmon underside
    sun: { kind: "sun", core: "#ffe1a8", rim: "#f4a259", halo: "#e08f6c" }, // worn for the middle hour of each golden window
    hills: { far: "#916d7c", near: "#7f5f71" },     // dusty mauve, the classic sunset silhouette
    flowers: true,
    tint: "rgba(150, 70, 40, 0.18)",                 // a warm glaze on the grass and tree
  },
};

const DARK: Record<Tone, SceneColors> = {
  dawn: {
    clouds: { body: "#5a4a62", belly: "#4a3c55" },
    sun: { kind: "sun", core: "#efcf9f", rim: "#d49a6a", halo: "#6a4a57" },
    hills: { far: "#4a3a4c", near: "#3b2e40" },
    flowers: false,
    tint: "rgba(20, 10, 30, 0.28)",
  },
  day: {
    clouds: { body: "#3d5b67", belly: "#33505c" },
    sun: { kind: "sun", core: "#e8ddb0", rim: "#cdb97c", halo: "#2f4f5c" },
    hills: { far: "#2e4a4c", near: "#27403f" },
    flowers: false,
    tint: "rgba(6, 10, 16, 0.22)",
  },
  dusk: {
    clouds: { body: "#3f3050", belly: "#4a3558" },
    sun: { kind: "sun", core: "#f2b877", rim: "#d9804f", halo: "#7a4052" },
    hills: { far: "#35263f", near: "#2a1f33" },
    flowers: false,
    tint: "rgba(16, 8, 28, 0.38)",
  },
  night: {
    clouds: null,
    sun: { kind: "moon", core: "#e6dfc6", rim: "#bdb59a", halo: "#18233a" },
    hills: { far: "#16222c", near: "#111b22" },
    flowers: false,
    tint: "rgba(4, 8, 20, 0.52)",
  },
  golden: {
    clouds: { body: "#67453a", belly: "#7e4c44" },
    sun: { kind: "sun", core: "#f0c48c", rim: "#d4834e", halo: "#6b3f3a" },
    hills: { far: "#442b36", near: "#37212e" },
    flowers: false,
    tint: "rgba(30, 12, 12, 0.32)",
  },
};

export function sceneColors(sky: Tone, dark: boolean): SceneColors {
  return (dark ? DARK : LIGHT)[sky];
}

/** The discs' colours: the moon always wears night's; the sun wears `sky`'s,
    or, when `sky` is night (whose entry is the moon), dawn's before noon
    and dusk's after. */
export function orbitalColors(hour: number, sky: Tone, dark: boolean): { sun: SceneColors["sun"]; moon: SceneColors["sun"] } {
  const colors = dark ? DARK : LIGHT;
  if (sky === "night") {
    sky = hour < 12 ? "dawn" : "dusk";
  }
  return {
    sun: colors[sky].sun,
    moon: colors["night"].sun,
  };
}

/** The ground's greens and the grass/soil line: the same in every sky
    (the tint does the dimming), and the same greens as the footer strip. */
export const GRASS = {
  edge: PALETTE.leafLight,
  body: PALETTE.leaf,
  fleck: PALETTE.leafDark,
  ink: "#1a1a18",
  flowers: ["#f4ecd8", "#e9c46a"],
} as const;

export const STAR = { bright: "#f1ecd9", dim: "#8f98ab" } as const;
export const FIREFLY = { core: "#f6dc86", glow: "rgba(246, 220, 134, 0.28)" } as const;
export const GLINT = "#fffaf0";

/** The apple's one-pixel ring: the tree's own dark rim, on every sky. The
    apple is an easter egg, not a beacon (Allen's call): it reads as part of
    the tree until someone looks closely. A warm pale ring on the dark skies
    made it the brightest thing in the scene. */
export const APPLE_RIM = PALETTE.pine;
