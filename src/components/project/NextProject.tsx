// src/components/project/NextProject.tsx
// The end of a case study: one wide link on to the next one, so a reader
// who finished a page always has somewhere to go.

import Link from "next/link";
import type { ProjectMeta } from "@/lib/projects";
import { FillerStamp } from "@/components/site/ui";
import { IconTile } from "./ProjectBits";
import styles from "./NextProject.module.css";

export default function NextProject({ project }: { project: ProjectMeta }) {
  // Named "Next <title> [Filler]" and described by the summary, rather than
  // one long name made of every word inside the link.
  const id = `next-${project.slug}`;
  const labelledBy = [`${id}-word`, `${id}-title`, project.filler && `${id}-filler`]
    .filter(Boolean)
    .join(" ");
  return (
    <nav aria-label="Next project">
      <Link
        href={`/projects/${project.slug}`}
        className={styles.next}
        aria-labelledby={labelledBy}
        aria-describedby={`${id}-summary`}
      >
        <IconTile name={project.icon} />
        <span className={styles.text}>
          <span className={styles.eyebrow}>
            <span id={`${id}-word`}>Next</span>
            {project.filler && <FillerStamp id={`${id}-filler`} className={styles.filler} />}
          </span>
          <span id={`${id}-title`} className={styles.title}>{project.title}</span>
          <span id={`${id}-summary`} className={styles.summary}>{project.summary}</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
