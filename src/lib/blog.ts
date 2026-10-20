// src/lib/blog.ts
// Posts live as MDX in content/blog/. The frontmatter feeds the list page
// and the sitemap; the body is rendered by the post page.
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** "YYYY-MM-DD". */
  date: string;
  tags: string[];
  /** Whole minutes at ~220 words a minute, at least 1. */
  minutes: number;
  /** A placeholder (`filler: true` in the frontmatter): out of the sitemap,
      and in production not found at all (see isShown). */
  filler: boolean;
};

export type Post = PostMeta & {
  content: string;
};

// YAML reads an unquoted `date: 2026-07-05` as a Date and a quoted one as a
// string; both come out as "YYYY-MM-DD".
function isoDay(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function readingMinutes(content: string): number {
  const words = content.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function parsePost(filename: string): Post {
  const slug = filename.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: isoDay(data.date),
    tags: data.tags ?? [],
    minutes: readingMinutes(content),
    filler: data.filler === true,
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parsePost)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content, ...meta }) => meta);
}

/** Whether the blog has a post that isn't a placeholder. Until it does, the
    blog stays out of the nav (site.ts) and the sitemap, and in production
    it answers 404 (D5, docs/SITE.md). */
export function hasRealPosts(): boolean {
  return getAllPosts().some((p) => !p.filler);
}

/** Whether a post shows on this server. Production never shows a
    placeholder (Allen, 2026-10-18): its page answers 404 and the list
    leaves it out, so the first real post brings the blog back on its own.
    Dev shows every post, so one can be written there. */
export function isShown(post: PostMeta): boolean {
  return !post.filler || process.env.NODE_ENV !== "production";
}

export function getPost(slug: string): Post | null {
  // The slug comes from the URL: only plain names reach the filesystem.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const filename = `${slug}.mdx`;
  if (!fs.existsSync(path.join(BLOG_DIR, filename))) return null;
  return parsePost(filename);
}

/** "Jul 5, 2026". Read as a calendar day, so no timezone can shift it. */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
