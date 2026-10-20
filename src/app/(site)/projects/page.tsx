// src/app/(site)/projects/page.tsx
// Every project, one list: the game first as a wide row (it's the flagship,
// and it gets a window into its own world), then the rest as cards. The
// stage pits the squire against Ulgar, not the home page's Adrix, so the
// two windows don't repeat each other. While the work is coming soon
// (COMING_SOON in site.ts), production shows a box here instead, out of
// the nav and out of search.

import type { Metadata } from "next";
import HearthStage, { StageFigure } from "@/components/project/HearthStage";
import ProjectCard from "@/components/project/ProjectCard";
import SquireApple from "@/components/site/SquireApple";
import { ComingSoon, PageHeader, QuietLink } from "@/components/site/ui";
import { getAllProjects } from "@/lib/projects";
import { isComingSoon, pageMeta } from "@/site";
import styles from "./projects.module.css";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Work",
    description: "Case studies of my work at Google and the projects I build on my own.",
    path: "/projects",
  }),
  ...(isComingSoon("work") && { robots: { index: false, follow: true } }),
};

const FLAGSHIP = "to-arms-squire";

export default function Projects() {
  if (isComingSoon("work")) {
    return (
      <main id="main" className={`wrap ${styles.main}`}>
        <PageHeader eyebrow="Work" title="Things I've made" />
        <ComingSoon action={<QuietLink href={`/projects/${FLAGSHIP}`} arrow>How the game was made</QuietLink>}>
          Case studies of my work are being written up.
        </ComingSoon>
      </main>
    );
  }

  const all = getAllProjects();
  const flagship = all.find((p) => p.slug === FLAGSHIP);
  const rest = all.filter((p) => p.slug !== FLAGSHIP);

  return (
    <main id="main" className={`wrap ${styles.main}`}>
      <PageHeader
        eyebrow="Work"
        title="Things I've made"
        // lede="A game I'm building from scratch, the tools it grew, and the work I do by day. Each one opens into how it was made."
      />

      {flagship && (
        <div className={styles.flagship}>
          <ProjectCard
            project={flagship}
            headingLevel={2}
            stage={
              <HearthStage layout="duel">
                <StageFigure name="me_combat" atFeet={<SquireApple />} />
                <StageFigure name="boss_ulgar" flip />
              </HearthStage>
            }
          />
        </div>
      )}

      {rest.length > 0 && (
        <ul className={styles.grid}>
          {rest.map((p) => (
            <li key={p.slug}>
              <ProjectCard project={p} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
