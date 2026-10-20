// src/app/(site)/about/page.tsx
// Who Allen is, at a glance: a portrait and the bio side by side, then the
// work history as a timeline (ExperienceTimeline, with the internships
// folded into one row), the toolbox as stamped groups, and the interests
// as a grid of linked badges (interests.ts).
//
// TODO(Allen): the toolbox wears a Filler stamp until it's settled, and the
// interests' intro line is filler too. Production shows both (COMING_SOON
// in site.ts went false on 2026-10-13).

import type { Metadata } from "next";
import ExperienceTimeline from "@/components/site/ExperienceTimeline";
import InterestGrid from "@/components/site/InterestGrid";
import InterestIcon from "@/components/site/InterestIcon";
import { ButtonLink, ComingSoon, FillerStamp, PageHeader, QuietLink, SectionHead, Stamps } from "@/components/site/ui";
import { SITE, isComingSoon, pageMeta } from "@/site";
import { INTERESTS, relatedTo, type Interest } from "./interests";
import styles from "./about.module.css";

export const metadata: Metadata = pageMeta({
  title: "About",
  description: `About ${SITE.name}: ${SITE.description}`,
  path: "/about",
});

// Newest first: the top row is the current job, and its node is filled.
const EXPERIENCE = [
  { years: "2025 – now", role: "Senior Software Engineer", org: "Google – AI Personalization", note: "LLM personalization: memory, multi-turn, and personal context, across all AI Mode and AI Overview queries." },
  { years: "2021 – 2025", role: "Software Engineer III", org: "Google – Shopping Search Features", note: "Full-stack web development: refinements, result quality, and page layout." },
  { years: "2019 – 2021", role: "Software Engineer II", org: "Google – Shopping Mobile App", note: "Full-stack iOS development: helped build the Shopping mobile app from the ground up, on the client and its presentation server." },
];

// Folded into one row under the jobs, which still names each company, until
// a visitor unfolds them (Allen's pick, 2026-10-14).
const INTERNSHIPS = [
  { years: "2018", role: "Software Engineer Intern", org: "Facebook – Monetization", note: "Full-stack iOS development: created an augmented reality ad format with try-on features live within the Facebook feed." },
  { years: "2018", role: "Software Engineer Intern", org: "Google – User Feedback", note: "Full-stack web development: created tools to automate and organize user feedback data across Google products." },
  { years: "2017", role: "Software Engineer Intern", org: "Apple – AppleCare", note: "Full-stack web development: built tools that cut day-long employee workflows to minutes." },
  { years: "2016", role: "Software Engineer Intern", org: "Acenda", note: "Full-stack web development: e-commerce website templating and building rich shopping features." },
];

// Languages first, since it's what people scan for; every other group is
// an area of work. Keep it to four: the tray is four compartments (2×2 on
// phones), so a fifth would sit alone. Work frameworks wait on clearance,
// and an internal name needs plain words to mean anything outside Google.
// Still settling, so the section keeps its Filler stamp.
const TOOLBOX = [
  { label: "Languages", items: ["TypeScript", "JavaScript", "Java", "C++", "Python", "Kotlin", "Swift", "C#", "C", "Go"] },
  { label: "Web", items: ["React", "Next.js", "Node.js", "Vercel", "Supabase"] },
  { label: "AI & data", items: ["Prompt tuning", "Agentic coding", "Metrics analysis", "Colab notebooks"] },
  { label: "Mobile & game dev", items: ["Godot", "iOS", "React Native", "Unity", "Flutter"] },
];

export default function About() {
  return (
    <main id="main" className="wrap">
      <PageHeader eyebrow="About" title={SITE.name} />

      <section className={styles.intro} aria-label="Introduction">
        {/* 660px square, three times the frame's 220, so it stays sharp on
            a retina screen (public/about/allen.webp). */}
        <img
          className={styles.portrait}
          src="/about/allen.webp"
          width={660}
          height={660}
          alt="Allen smiling, flashing peace signs with both hands, among redwoods"
        />

        <div className={styles.bio}>
          <p className={styles.lead}>I'm a software engineer focused on LLM personalization at Google.</p>
          <p>
          I build compelling user-facing products from design to launch. Currently, I'm based in the SF Bay Area.
          </p>
          <p>
            I enjoy cooking things from scratch, and I'm not just talking about tech!
          </p>
          <div className={styles.actions}>
            <ButtonLink href="/contact" arrow>Get in touch</ButtonLink>
            {!isComingSoon("work") && <QuietLink href="/projects">See my work</QuietLink>}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="experience-title">
        <SectionHead
          title={<span id="experience-title">Experience</span>}
          action={
            <QuietLink href={SITE.resume}>
              Résumé<span className="visually-hidden"> (PDF, opens in a new tab)</span>
              <span aria-hidden="true">↗</span>
            </QuietLink>
          }
        />
        <ExperienceTimeline jobs={EXPERIENCE} internships={INTERNSHIPS} />
      </section>

      <section className={styles.section} aria-labelledby="toolbox-title">
        {isComingSoon("toolbox") ? (
          <>
            <SectionHead title={<span id="toolbox-title">Toolbox</span>} />
            <ComingSoon>The languages, frameworks, and tools I work with.</ComingSoon>
          </>
        ) : (
          <>
            <SectionHead title={<span id="toolbox-title">Toolbox</span>} />
            <div className={styles.toolbox}>
              {TOOLBOX.map((group) => (
                <div key={group.label} className={styles.group}>
                  <h3 className={styles.groupLabel}>{group.label}</h3>
                  <Stamps items={group.items} label={group.label} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {!isComingSoon("interests") && (
        <section className={styles.section} aria-labelledby="interests-title">
          <SectionHead title={<span id="interests-title">Interests</span>} />
          <InterestGrid
            intro="Some facts about me, and some of my interests."
            items={INTERESTS.map((i: Interest) => ({
              id: i.id,
              label: i.label,
              head: i.head,
              description: i.description,
              link: i.link,
              related: relatedTo(i.id),
              icon: <InterestIcon icon={i.icon} />,
            }))}
          />
        </section>
      )}
    </main>
  );
}
