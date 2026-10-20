// src/app/font-picker/catalog/route.ts
// Every Latin family on Google Fonts, trimmed to what the font picker needs,
// so a family typed into its search loads with exactly the styles it has.
// Read on the server: fonts.google.com sends no CORS headers. Dev only, like
// the page.

import type { Family, Kind } from "@/components/font-picker/fonts";

const KINDS: Record<string, Kind> = {
  Serif: "serif",
  "Sans Serif": "sans",
  Monospace: "mono",
  Display: "display",
  Handwriting: "handwriting",
};

interface GoogleFamily {
  family: string;
  category: string;
  subsets: string[];
  fonts: Record<string, unknown>;
  axes?: { tag: string; min: number; max: number }[];
}

let catalog: Family[] | null = null;

function trim(g: GoogleFamily): Family {
  const styles = Object.keys(g.fonts);
  const weights = (italic: boolean) =>
    [...new Set(styles.filter((s) => s.endsWith("i") === italic).map((s) => parseInt(s, 10)))]
      .filter((w) => w >= 100 && w <= 900)
      .sort((a, b) => a - b);
  const axis = (tag: string) => {
    const a = g.axes?.find((x) => x.tag === tag);
    return a ? ([a.min, a.max] as [number, number]) : undefined;
  };
  const i = weights(true);
  return {
    name: g.family,
    kind: KINDS[g.category] ?? "display",
    w: weights(false),
    ...(i.length && { i }),
    ...(axis("wght") && { wght: axis("wght") }),
    ...(axis("opsz") && { opsz: axis("opsz") }),
  };
}

export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  if (!catalog) {
    // About 2.7 MB, past what Next's fetch cache will hold, so no-store.
    const res = await fetch("https://fonts.google.com/metadata/fonts", { cache: "no-store" });
    if (!res.ok) return new Response("Google Fonts didn't answer", { status: 502 });
    const json = JSON.parse((await res.text()).replace(/^\)\]\}'\s*/, ""));
    catalog = (json.familyMetadataList as GoogleFamily[])
      .filter((g) => g.subsets.includes("latin"))
      .map(trim)
      .filter((f) => f.w.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return Response.json(catalog);
}
