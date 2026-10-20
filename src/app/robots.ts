// src/app/robots.ts
// Served at /robots.txt: crawl everything but the API, sign-in and the dev
// tools.

import type { MetadataRoute } from "next";
import { SITE } from "@/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/sprite-editor",
        "/skill-tree-editor",
        "/game/deal-preview",
        "/game/dialog-preview",
        "/game/quest-audit",
        "/game/sprite-editor",
      ],
    },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
