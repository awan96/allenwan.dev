// src/app/sitemap.ts
// Every public page, served at /sitemap.xml. Projects and posts are read
// from content/, so a new MDX file lands here with no edit.

import type { MetadataRoute } from "next";
import { getAllPosts, hasRealPosts } from "@/lib/blog";
import { getAllProjects } from "@/lib/projects";
import { SITE, isComingSoon } from "@/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE.url).toString();

  // The blog joins the map with its first real post, as it joins the nav
  // (D5); the Work page with its work, once it's no longer coming soon.
  const blog = hasRealPosts() ? ["/blog"] : [];
  const work = isComingSoon("work") ? [] : ["/projects"];
  const pages: MetadataRoute.Sitemap = ["/", "/about", ...work, ...blog, "/contact", "/game"].map((path) => ({
    url: url(path),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));

  // Filler case studies are placeholders: they join the map once they're real.
  const projects: MetadataRoute.Sitemap = getAllProjects()
    .filter((p) => !p.filler)
    .map((p) => ({
      url: url(`/projects/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const posts: MetadataRoute.Sitemap = getAllPosts().filter((p) => !p.filler).map((p) => ({
    url: url(`/blog/${p.slug}`),
    ...(p.date ? { lastModified: p.date } : {}),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...projects, ...posts];
}
