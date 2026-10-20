// src/lib/shareImage.tsx
// The picture a shared link previews with (1200 by 630, Open Graph): the
// hero's day sky in its five bands, the pixel tree on the footer's ground,
// and the page's name in the site's own type. Every opengraph-image file in
// the app draws through here, so the cards stay one design. The tree stands
// bare: the apple is drawn only where its state lives (docs/SITE.md, D2).

import { ImageResponse } from "next/og";
import { colorForChar } from "@/components/pixel/roles";
import { GRIDS, ICON_ROLES, PALETTE } from "@/components/pixel/siteSprites";
import { encodeSprite, spriteMarkup } from "@/components/pixel/spritePaths";
import { SITE } from "@/site";

export const SHARE_SIZE = { width: 1200, height: 630 };
export const SHARE_TYPE = "image/png";
export const SITE_HOST = new URL(SITE.url).host;

// One art pixel, in image pixels.
const PX = 11;
// The day sky's bands, top to horizon, and where each ends (HeroScene.module.css).
const SKY: [string, number][] = [
  ["#9fc6d4", 30], ["#b0d0db", 55], ["#c2dadf", 74], ["#d4e4e1", 88], ["#e3ece2", 100],
];
// The ground, top to bottom (the hero's grass, the footer's soil): rows of art pixels.
const GROUND: [string, number][] = [["#3f7a5c", 1], ["#2a5c45", 3], ["#3f2b20", 1], ["#5d4030", 5]];
const GROUND_H = GROUND.reduce((h, [, rows]) => h + rows * PX, 0);

function skyGradient(): string {
  let from = 0;
  const stops = SKY.map(([color, to]) => {
    const stop = `${color} ${from}%, ${color} ${to}%`;
    from = to;
    return stop;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

// The tree as a crisp SVG data URI, one path per colour (spritePaths.ts).
function tree(): { src: string; width: number; height: number } {
  const grid = GRIDS.apple_tree;
  const w = Math.max(...grid.map((row) => row.length));
  const paths = encodeSprite(grid, (ch) => colorForChar(ch, ICON_ROLES.apple_tree, PALETTE));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${grid.length}" shape-rendering="crispEdges">${spriteMarkup(paths)}</svg>`;
  return { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width: w * PX, height: grid.length * PX };
}

// A Google font cut down to the characters drawn. Satori needs TTF or OTF,
// which Google serves to a client that doesn't ask for WOFF2.
async function googleFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error(`no TTF for ${family}`);
  return (await fetch(src[1])).arrayBuffer();
}

export async function shareImage({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const art = tree();
  const text = eyebrow.toUpperCase() + title + subtitle;
  // Without the fonts (no network at build, say) the card still draws, in
  // next/og's own sans. The label is a size up from DM Mono's 24, as the
  // page's --text-label is, for Sometype Mono's smaller capitals.
  const fonts = await Promise.all([
    googleFont("Vollkorn:wght@600", text).then((data) => ({ name: "Vollkorn", data, weight: 600 as const, style: "normal" as const })),
    googleFont("Karla:wght@500", text).then((data) => ({ name: "Karla", data, weight: 500 as const, style: "normal" as const })),
    googleFont("Sometype+Mono:wght@500", text).then((data) => ({ name: "Sometype Mono", data, weight: 500 as const, style: "normal" as const })),
  ]).catch(() => undefined);
  const titleSize = title.length <= 12 ? 124 : title.length <= 18 ? 100 : title.length <= 28 ? 84 : 68;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundImage: skyGradient() }}>
        <div style={{ position: "absolute", left: 80, top: 84, width: 640, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontFamily: "Sometype Mono", fontSize: 25, letterSpacing: 3, color: "#2a5c45", textTransform: "uppercase" }}>
            {eyebrow}
          </div>
          <div style={{ fontFamily: "Vollkorn", fontWeight: 600, fontSize: titleSize, lineHeight: 1.04, color: "#1a1a18" }}>{title}</div>
          <div style={{ fontFamily: "Karla", fontWeight: 500, fontSize: 36, color: "#3d3d38" }}>{subtitle}</div>
        </div>
        <img src={art.src} width={art.width} height={art.height} alt="" style={{ position: "absolute", right: 110, bottom: GROUND_H }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column" }}>
          {GROUND.map(([color, rows]) => (
            <div key={color} style={{ height: rows * PX, backgroundColor: color }} />
          ))}
        </div>
      </div>
    ),
    { ...SHARE_SIZE, fonts },
  );
}
