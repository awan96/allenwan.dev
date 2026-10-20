// src/app/(site)/projects/[slug]/page.tsx
// A case study: the header says what it is at a glance (with the one big
// action, play or open it), then the MDX body tells how it was made, then
// one link on to the next project.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MdxBody from "@/components/project/MdxBody";
import NextProject from "@/components/project/NextProject";
import { IconTile, metaLine } from "@/components/project/ProjectBits";
import ProjectCover from "@/components/project/ProjectCover";
import { ButtonLink, DetailHeader, FillerStamp, QuietLink } from "@/components/site/ui";
import { getAllProjects, getNextProject, getProject, type Project, type ProjectLinks } from "@/lib/projects";
import { isComingSoon, pageMeta } from "@/site";
import styles from "./study.module.css";

type Props = { params: Promise<{ slug: string }> };

// While the work is coming soon (site.ts), production hides the placeholder
// studies (not found), and the real ones link home instead of to the
// hidden Work page, and on only to each other.
const WORK_SOON = isComingSoon("work");
const shown = (p: Project | null): p is Project => !!p && !(WORK_SOON && p.filler);

export function generateStaticParams() {
  return getAllProjects().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!shown(project)) return { title: "Page not found" };
  return {
    ...pageMeta({ title: project.title, description: project.summary, path: `/projects/${slug}`, type: "article", ownImage: true }),
    // A filler page is linked from the cards but kept out of search until
    // it's real; this lifts on its own when `filler` goes false.
    ...(project.filler && { robots: { index: false, follow: true } }),
  };
}

/** The one big action. Playing it here beats visiting it; a page on this
    site is "tried", an outside one "visited". The code stays a quiet link. */
function primaryAction(links: ProjectLinks): { href: string; label: string } | null {
  if (links.play) return { href: links.play, label: "Play it" };
  if (links.live) return { href: links.live, label: links.live.startsWith("/") ? "Try it" : "Visit site" };
  return null;
}

export default async function CaseStudy({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!shown(project)) notFound();

  const next = getNextProject(slug, WORK_SOON);
  const action = primaryAction(project.links);
  const meta = metaLine(project);

  const quiet = project.links.repo
    ? { href: project.links.repo, label: "Code ↗" }
    : project.links.video
      ? { href: project.links.video, label: "Video ↗" }
      : null;

  return (
    <main id="main" className={styles.main}>
      <div className="wrap">
        <DetailHeader
          back={WORK_SOON ? { href: "/", label: "Home" } : { href: "/projects", label: "All work" }}
          note={
            project.filler && (
              <p className={styles.fillerNote}>
                <FillerStamp />
                <span>Placeholder text — swap in your own</span>
              </p>
            )
          }
          meta={meta || undefined}
          title={project.title}
          lede={project.summary}
          stamps={project.stack}
          stampsLabel="Built with"
          actions={
            (action || quiet) && (
              <>
                {/* The game's link doesn't prefetch: that would download the
                    whole game while the visitor reads. */}
                {action && <ButtonLink href={action.href} arrow prefetch={action.href === "/game" ? false : undefined}>{action.label}</ButtonLink>}
                {quiet && <QuietLink href={quiet.href}>{quiet.label}</QuietLink>}
              </>
            )
          }
          art={project.cover ? <ProjectCover cover={project.cover} /> : <IconTile name={project.icon} size="lg" />}
          cover={Boolean(project.cover)}
        />
      </div>

      <article className={`wrap ${styles.body}`}>
        <MdxBody source={project.content} />
      </article>

      {next && (
        <div className={`wrap ${styles.after}`}>
          <NextProject project={next} />
        </div>
      )}
    </main>
  );
}
