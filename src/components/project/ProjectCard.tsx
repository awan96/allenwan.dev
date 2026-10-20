// src/components/project/ProjectCard.tsx
// One project, at a glance: icon, year and role, title, a two-line summary
// and the stack. The whole card is one link to its case study. Given a
// `stage`, it becomes the wide flagship row: art on the left, text right.

import Link from "next/link";
import type { ReactNode } from "react";
import { FillerStamp, Stamps } from "@/components/site/ui";
import type { ProjectMeta } from "@/lib/projects";
import { IconTile, metaLine } from "./ProjectBits";
import styles from "./ProjectCard.module.css";

type Props = {
  project: ProjectMeta;
  /** h3 under a section heading (home); h2 straight under a page title. */
  headingLevel?: 2 | 3;
  /** Art for the wide flagship layout (e.g. a HearthStage). */
  stage?: ReactNode;
};

export default function ProjectCard({ project, headingLevel = 3, stage }: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const meta = metaLine(project);
  // Name the link by its title (and "Filler" when it is), describe it by
  // its summary. Left to itself the link's name would be the whole card,
  // ending in the stamp list's bare "Built with". A project is carded at
  // most once per page, so the slug makes the ids unique.
  const id = `card-${project.slug}`;
  const labelledBy = project.filler ? `${id}-title ${id}-filler` : `${id}-title`;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`${styles.card} ${stage ? styles.feature : ""}`}
      aria-labelledby={labelledBy}
      aria-describedby={`${id}-summary`}
    >
      {stage && <div className={styles.art} aria-hidden="true">{stage}</div>}

      <div className={styles.body}>
        {!stage && (
          <div className={styles.top}>
            <IconTile name={project.icon} />
          </div>
        )}
        {project.filler && <FillerStamp id={`${id}-filler`} className={styles.filler} />}

        {meta && <p className={styles.meta}>{meta}</p>}
        <Heading id={`${id}-title`} className={styles.title}>{project.title}</Heading>
        <p id={`${id}-summary`} className={styles.summary}>{project.summary}</p>

        <div className={styles.foot}>
          <Stamps items={project.stack} label="Built with" />
          <span className={styles.go} aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
