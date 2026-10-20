// src/site.ts
// Who the site is about, in one place. The metadata, the nav, the footer,
// the contact page, the sitemap and robots all read from here, so a detail
// changes once.

import type { Metadata } from "next";

export const SITE = {
  name: "Allen Wan",
  firstName: "Allen",
  role: "Full-stack engineer",
  /** One line under the name: metadata description, OG cards. */
  description:
    "Full-stack engineer building products from design to launch. Currently working on LLM personalization at Google Search.",
  /** The hero's paragraph, then its closing line. */
  bio: "I'm a software engineer who turns complexity into sharp, delightful user experiences.",
  catchphrase: "I believe enjoying the process of creation fuels the brilliance of the product.",
  /** The domain (D6): canonicals, the sitemap, robots and every share
      link are built on it. The bare domain is primary; www redirects. */
  url: "https://allenwan.dev",
  /** True while the email and the handles below are placeholders: the
      contact page shows them as plain text, and the footer leaves them
      out. Set false once they're real. */
  placeholderContact: false,
  email: "allenwan96@gmail.com",
  /** `handle` is what the contact page shows for each link. */
  socials: [
    { label: "GitHub", href: "https://github.com/awan96", handle: "github.com/awan96" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/allenwan96", handle: "linkedin.com/in/allenwan96" },
  ],
  /** The résumé: a copy of ../resume/Allen Wan - Resume.pdf, served from
      public/. The contact page lists it and About's Experience links it.
      Copy the PDF over this file whenever the résumé changes; the URL
      stays put, so links already sent out keep working. */
  resume: "/resume.pdf",
} as const;

/** Parts of the site still being written (Allen, 2026-10-07). In production
    each shows a "coming soon" box in place of its content while its flag
    is true; in dev the real content shows, so it can be worked on.
    `work`: the Work page and its nav tab, the home page's work grid, and
    the filler case studies (404). `toolbox`: About's toolbox.
    `interests`: About's interest badges, which production leaves out
    altogether rather than boxing, so the page doesn't end on two boxes.
    All three went false on 2026-10-13, at Allen's word: everything shows,
    to be finished before the launch. A flag can go back on if a part
    slips. */
export const COMING_SOON: Record<"work" | "toolbox" | "interests", boolean> = { work: false, toolbox: false, interests: false };

export function isComingSoon(part: keyof typeof COMING_SOON): boolean {
  return COMING_SOON[part] && process.env.NODE_ENV === "production";
}

// `prefetch: false` on the game: Next would otherwise download its whole
// client bundle in the background on every page that shows the link.
// The blog is out of the nav until it has a real post (D5, docs/SITE.md):
// the one post today is a placeholder (`filler: true`), and production
// answers 404 for the blog until then. Put
// { href: "/blog", label: "Blog" } back after About with the first real one.
// Work is out of it while it's coming soon (COMING_SOON above).
export const NAV_LINKS: readonly { href: string; label: string; prefetch?: boolean }[] = [
  { href: "/projects", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/game", label: "Game", prefetch: false },
].filter((l) => !(l.href === "/projects" && isComingSoon("work")));

/** The site's share image (app/opengraph-image.tsx, drawn by
    lib/shareImage.tsx). A page's openGraph replaces its parents' whole,
    images and all, so every page names it here, except a route with an
    opengraph-image file of its own (the game, each case study), which
    passes ownImage: an image named here would outrank its file. */
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name} · ${SITE.role}` };

/** A page's metadata, whole: a page's openGraph and twitter replace the
    root layout's, so each page restates them or its shared link previews
    as the home page. The canonical path also folds ?sky= and other query
    variants into one URL. No title means the site's own (the home page). */
export function pageMeta({
  title,
  description,
  path,
  type = "website",
  published,
  ownImage = false,
}: {
  title?: string;
  description: string;
  path: string;
  type?: "website" | "article";
  /** An article's date (ISO), for og:article:published_time. */
  published?: string;
  /** The route has an opengraph-image file of its own (the game, a case
      study); naming the site's image here would outrank it. */
  ownImage?: boolean;
}): Metadata {
  const full = title ? `${title} · ${SITE.name}` : `${SITE.name} · ${SITE.role}`;
  const og = { title: full, description, url: path, siteName: SITE.name, locale: "en_US", ...(!ownImage && { images: [SHARE_IMAGE] }) };
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: type === "article" ? { ...og, type, publishedTime: published } : { ...og, type },
    twitter: { card: "summary_large_image", title: full, description, ...(!ownImage && { images: [SHARE_IMAGE.url] }) },
  };
}
