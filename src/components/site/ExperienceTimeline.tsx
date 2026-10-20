// src/components/site/ExperienceTimeline.tsx
// The About page's work history (data: app/(site)/about/page.tsx): a rail of
// square nodes, newest first, the current role's node filled. The
// internships fold into one row that still names every company, its node
// two stacked squares, so the whole career reads at a glance without
// pushing the rest of the page a screen down (Allen's pick, B of five
// mocks, 2026-10-14). "Show all four" unfolds them into rows like the
// others and moves focus to the first; "Hide internships", under the
// last, folds them back and returns focus to "Show all four". The folded
// rows stay in the HTML, hidden, so search and find-in-page see them.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { QuietButton } from "./ui";
import styles from "./ExperienceTimeline.module.css";

export type Job = { years: string; role: string; org: string; note: string };

type Props = {
  jobs: readonly Job[];
  /** Folded into one row until asked for. */
  internships: readonly Job[];
};

const NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** "Facebook – Monetization" → "Facebook". */
const company = (org: string) => org.split(" – ")[0];

/** "a, b, and c": the serial comma, as everywhere on the site. */
function inWords(items: readonly string[]) {
  if (items.length < 3) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** The years a set of rows covers, oldest to newest: "2016 – 2018". */
function span(rows: readonly Job[]) {
  const years = rows.flatMap((j) => j.years.match(/\d{4}/g) ?? []).map(Number);
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first} – ${last}`;
}

function Row({ job, id, headingId, hidden }: { job: Job; id?: string; headingId?: string; hidden?: boolean }) {
  return (
    <li id={id} className={styles.job} hidden={hidden}>
      <span className={styles.years}>{job.years}</span>
      <div className={styles.jobBody}>
        <h3 id={headingId} tabIndex={headingId ? -1 : undefined} className={styles.role}>
          <span className={styles.roleName}>{job.role}</span>{" "}
          <span className={styles.org}><span className={styles.dot}>· </span>{job.org}</span>
        </h3>
        <p className={styles.note}>{job.note}</p>
      </div>
    </li>
  );
}

export default function ExperienceTimeline({ jobs, internships }: Props) {
  const [open, setOpen] = useState(false);
  // Where focus goes once a toggle has re-rendered the list; nowhere on the
  // first render, so loading the page never moves focus.
  const focusNext = useRef<string | null>(null);
  const base = useId();
  const rowIds = internships.map((_, i) => `${base}-internship-${i}`);
  const firstId = `${base}-first`;
  const unfoldId = `${base}-unfold`;

  useEffect(() => {
    if (focusNext.current) document.getElementById(focusNext.current)?.focus();
    focusNext.current = null;
  }, [open]);

  const roles = new Set(internships.map((j) => j.role));
  const count = NUMBERS[internships.length] ?? String(internships.length);

  return (
    <div className={styles.experience}>
      <ol className={styles.timeline}>
        {jobs.map((job, i) => (
          <Row key={i} job={job} />
        ))}
        {internships.length > 0 && (
          <li className={`${styles.job} ${styles.fold}`} hidden={open}>
            <span className={styles.years}>{span(internships)}</span>
            <div className={styles.jobBody}>
              <h3 className={styles.role}>
                <span className={styles.roleName}>{roles.size === 1 ? internships[0].role : "Internships"}</span>{" "}
                <span className={styles.org}><span className={styles.dot}>· </span>{inWords(internships.map((j) => company(j.org)))}</span>
              </h3>
              <QuietButton
                id={unfoldId}
                arrow="down"
                aria-expanded={open}
                aria-controls={rowIds.join(" ")}
                className={styles.toggle}
                onClick={() => {
                  focusNext.current = firstId;
                  setOpen(true);
                }}
              >
                Show all {count}<span className="visually-hidden"> internships</span>
              </QuietButton>
            </div>
          </li>
        )}
        {internships.map((job, i) => (
          <Row key={`internship-${i}`} job={job} id={rowIds[i]} headingId={i === 0 ? firstId : undefined} hidden={!open} />
        ))}
      </ol>
      {open && (
        <div className={styles.after}>
          <QuietButton
            arrow="up"
            onClick={() => {
              focusNext.current = unfoldId;
              setOpen(false);
            }}
          >
            Hide internships
          </QuietButton>
        </div>
      )}
    </div>
  );
}
