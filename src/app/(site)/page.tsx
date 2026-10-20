// src/app/(site)/page.tsx
import type { Metadata } from "next";
import HeroScene from "@/components/site/HeroScene";
import ProjectCard from "@/components/project/ProjectCard";
import HearthStage, { StageFigure } from "@/components/project/HearthStage";
import SquireApple from "@/components/site/SquireApple";
import { ButtonLink, ComingSoon, QuietLink, SectionHead } from "@/components/site/ui";
import { getAllProjects } from "@/lib/projects";
import { SITE, isComingSoon, pageMeta } from "@/site";
import styles from "./page.module.css";

// Here, not in the root layout, or every page would inherit canonical "/".
export const metadata: Metadata = pageMeta({ description: SITE.description, path: "/" });

// The game has its own feature block, so the grid shows the rest.
const GAME_SLUG = "to-arms-squire";

export default function Home() {
  const selected = getAllProjects().filter((p) => p.featured && p.slug !== GAME_SLUG);
  // While the work is coming soon (site.ts), "See my work" goes to the game
  // just below instead of a page that would only say so.
  const workSoon = isComingSoon("work");

  return (
    <main id="main">
      {/* The hold (docs/HOME_SCROLL.md §4): the scene is pinned inside this
          stretch of page only, so it holds still while the game card rises
          over it, then lets go and scrolls away with the card. */}
      <div>
        <HeroScene>
          <h1 className={styles.headline}>
            Hello, I&apos;m <em>{SITE.firstName}</em>
            <span className={styles.cursor} aria-hidden="true">_</span>
          </h1>
          <p className={styles.bio}>{SITE.bio} {SITE.catchphrase}</p>
          <div className={styles.actions}>
            <ButtonLink href={workSoon ? "#game" : "/projects"} arrow>See my work</ButtonLink>
            <QuietLink href="/contact">Get in touch</QuietLink>
          </div>
        </HeroScene>

        {/* The game, framed as a window into its own world (Hearthlight). */}
        <section id="game" className={`wrap ${styles.section} ${styles.over}`} aria-labelledby="game-title">
          <article className={styles.game}>
            <div className={styles.stage} aria-hidden="true">
              <HearthStage layout="duel">
                <StageFigure name="me_combat" atFeet={<SquireApple />} />
                <StageFigure name="boss_spirit_of_adrix" flip />
              </HearthStage>
            </div>
            <div className={styles.gameText}>
              <span className={styles.gameEyebrow}>Featured · playable here</span>
              <h2 id="game-title" className={styles.gameTitle}>To Arms, Squire!</h2>
              <p className={styles.gameDesc}>
                A browser RPG I built from scratch, with card-driven duels and bosses that
                learn your habits. Don&apos;t read about it, play it.
              </p>
              <div className={styles.actions}>
                <ButtonLink href="/game" arrow prefetch={false} className={styles.playBtn}>Play it</ButtonLink>
                <QuietLink href={`/projects/${GAME_SLUG}`} className={styles.gameQuiet}>How it&apos;s made</QuietLink>
              </div>
            </div>
          </article>
        </section>
      </div>

      {selected.length > 0 && (
        <section className={`wrap ${styles.section}`} aria-labelledby="work-title">
          <SectionHead
            eyebrow="Selected work"
            title={<span id="work-title">Things I&apos;ve built</span>}
            action={!workSoon && <QuietLink href="/projects" arrow>All projects</QuietLink>}
          />
          {workSoon ? (
            <ComingSoon>More case studies are on their way.</ComingSoon>
          ) : (
            <ul className={styles.cards}>
              {selected.map((p) => (
                <li key={p.slug}>
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
