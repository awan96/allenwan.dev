// src/components/project/ProjectCover.tsx
// A case study's cover, beside its header: a live scene by name, or an
// image or a clip. It says nothing the title doesn't, so it's decoration to
// a screen reader (a clip stays reachable, for its controls under reduced
// motion).

import SquireApple from "@/components/site/SquireApple";
import HearthStage, { StageFigure } from "./HearthStage";
import { isClip } from "./Figure";
import { Clip } from "./FigureMedia";
import styles from "./ProjectCover.module.css";

// Live covers, by the name the frontmatter uses. The duel pits the squire
// against Adrix, as the home page does (Allen, 2026-10-06); /projects
// opens on Ulgar.
const LIVE: Record<string, () => React.ReactNode> = {
  duel: () => (
    <HearthStage layout="duel">
      <StageFigure name="me_combat" atFeet={<SquireApple />} />
      <StageFigure name="boss_spirit_of_adrix" flip />
    </HearthStage>
  ),
};

export default function ProjectCover({ cover }: { cover: string }) {
  const live = LIVE[cover];
  const clip = !live && isClip(cover);
  return (
    <div className={styles.cover} aria-hidden={clip ? undefined : true}>
      {live ? (
        live()
      ) : clip ? (
        <Clip src={cover} alt="" className={styles.media} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a cover's size comes from the file
        <img src={cover} alt="" className={styles.media} />
      )}
    </div>
  );
}
