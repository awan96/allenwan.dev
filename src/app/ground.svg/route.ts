// /ground.svg: the footer's and the 404's ground tile (components/site/ground.ts),
// built once at build time. Its URL carries a fingerprint of the tile, so it
// can be cached for good.
import { GROUND_SVG } from "@/components/site/ground";

export const dynamic = "force-static";

export function GET() {
  return new Response(GROUND_SVG, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
