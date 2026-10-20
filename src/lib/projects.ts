// src/lib/projects.ts
// Case studies live as MDX in content/projects/. The frontmatter feeds the
// cards (home + /projects, one list so they can't drift); the body is the
// case-study page, mixing prose with the components in components/project.
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");
// Candidate case studies, never read by the site itself: the dev-only
// preview at /drafts renders them so they can be reviewed as pages.
const DRAFTS_DIR = path.join(process.cwd(), "content", "drafts");

export type ProjectLinks = {
  /** Where to play or use it on this site (e.g. /game). */
  play?: string;
  live?: string;
  repo?: string;
  /** A walkthrough clip hosted elsewhere (a quiet link in the header). */
  video?: string;
};

export type ProjectMeta = {
  slug: string;
  title: string;
  /** One or two sentences: the card's body and the page's lede. */
  summary: string;
  role: string;
  /** "2026" or "2024–2026". */
  year: string;
  stack: string[];
  links: ProjectLinks;
  /** A site sprite name (siteSprites.ts), drawn on the card. */
  icon?: string;
  /** The case study's cover, beside its header: an image path, a clip
      (.mp4 / .webm), or a live scene by name ("duel"). Without one the
      header shows the icon. */
  cover?: string;
  /** Shown on the home page. */
  featured: boolean;
  /** Sort key, ascending. */
  order: number;
  /** Placeholder content: the card and page wear a "Filler" stamp. */
  filler: boolean;
};

export type Project = ProjectMeta & { content: string };

function parseProject(filename: string, dir = PROJECTS_DIR): Project {
  const slug = filename.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(dir, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    summary: data.summary ?? "",
    role: data.role ?? "",
    year: String(data.year ?? ""),
    stack: data.stack ?? [],
    links: data.links ?? {},
    icon: data.icon,
    cover: data.cover,
    featured: data.featured ?? false,
    order: data.order ?? 999,
    filler: data.filler ?? false,
    content,
  };
}

export function getAllProjects(): ProjectMeta[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => parseProject(f))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map(({ content, ...meta }) => meta);
}

export function getProject(slug: string): Project | null {
  const filename = `${slug}.mdx`;
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(path.join(PROJECTS_DIR, filename))) return null;
  return parseProject(filename);
}

/** The case study after this one, wrapping to the first. `skipFiller`
    passes over the placeholder studies (while the work is coming soon). */
export function getNextProject(slug: string, skipFiller = false): ProjectMeta | null {
  const all = getAllProjects().filter((p) => !skipFiller || !p.filler || p.slug === slug);
  if (all.length < 2) return null;
  const i = all.findIndex((p) => p.slug === slug);
  return all[(i + 1) % all.length];
}

/** The drafts in content/drafts/, for the dev-only preview at /drafts. */
export function getAllDrafts(): ProjectMeta[] {
  if (!fs.existsSync(DRAFTS_DIR)) return [];
  return fs
    .readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => parseProject(f, DRAFTS_DIR))
    .sort((a, b) => a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug))
    .map(({ content, ...meta }) => meta);
}

export function getDraft(slug: string): Project | null {
  const filename = `${slug}.mdx`;
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(path.join(DRAFTS_DIR, filename))) return null;
  return parseProject(filename, DRAFTS_DIR);
}
