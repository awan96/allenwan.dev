// src/components/site/InterestGrid.tsx
// The About page's interest badges (data: app/(site)/about/interests.ts): a
// panel that reads one interest out, over a grid of pixel badges. Pointing
// at a badge, or reaching it with the keyboard, shows it in the panel and
// lights up the badges it links to while the rest step back. Clicking pins
// it: the panel keeps it once the pointer leaves, and pointing at another
// overrides the pin only while the pointer stays. Click it again, or press
// Escape, to let go. On a touchscreen a tap pins.
//
// An interest can carry a link, shown in the panel under its line. Leaving
// the grid lets go of a preview, so a pointer reaches a link by pinning its
// badge first; on a touchscreen the tap that shows it has pinned it. The
// keyboard gets one stop for the whole grid: the arrow keys move between
// badges, and Shift+Tab steps up from a badge to its link.
//
// The heads (the broad interests) come first and the finer ones follow, in
// one run: a rough grouping, so a row can hold both.
"use client";

import { useId, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { QuietLink, Stamps } from "./ui";
import styles from "./InterestGrid.module.css";

export type InterestItem = {
  id: string;
  label: string;
  /** A broad interest: the heads come first, the finer ones after. */
  head?: boolean;
  description: string;
  /** The ids it links to, in the grid's order. */
  related: readonly string[];
  /** A tidbit: where the panel's link goes, and what it says. */
  link?: { href: string; label: string };
  /** Its pixel icon, drawn on the server (InterestIcon). */
  icon: ReactNode;
};

type Props = {
  items: readonly InterestItem[];
  /** The panel's words while nothing is pointed at or pinned. */
  intro: ReactNode;
};

// Focus from the keyboard reads a badge out, as pointing does. A click
// focuses the button too (a tap, in some browsers), and that focus mustn't
// hold the panel on a badge once its pin is let go.
function fromKeyboard(el: Element) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

// A touch has no hover: a tap is a click, and a click pins.
const isTouch = (e: PointerEvent) => e.pointerType === "touch";

const MOVES = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

export default function InterestGrid({ items, intro }: Props) {
  const uid = useId();
  const [pinned, setPinned] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  // Heads first, then the finer ones: the order the grid shows and the
  // arrow keys follow.
  const heads = useMemo(() => items.filter((i) => i.head), [items]);
  const finer = useMemo(() => items.filter((i) => !i.head), [items]);
  const ordered = useMemo(() => [...heads, ...finer], [heads, finer]);
  // The badge Tab lands on: the grid is one stop, and the arrow keys move it.
  // (An edit that drops that interest hands the stop back to the first.)
  const [stopId, setStop] = useState(ordered[0]?.id);
  const stop = ordered.some((i) => i.id === stopId) ? stopId : ordered[0]?.id;
  // The panel shows the badge being pointed at, else the pinned one.
  const currentId = preview ?? pinned;
  const current = currentId ? byId.get(currentId) : undefined;

  function stateOf(id: string) {
    if (!current) return undefined;
    if (id === current.id) return "current";
    return current.related.includes(id) ? "related" : "faded";
  }

  // The preview clears when the pointer leaves the whole grid, not each
  // badge, so crossing the gap between two never flashes the panel back.
  function leaveGrid(e: PointerEvent) {
    if (!isTouch(e)) setPreview(null);
  }

  // Focus leaving the whole thing lets go of a preview; stepping from a
  // badge up to the panel's link keeps it, so the link stays where it is.
  function blurAll(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) setPreview(null);
  }

  // The badge in the next row up or down whose middle sits nearest this
  // one's, read from the layout, since the columns change with the width.
  // It measures the <li>s: a lifted badge sits 3px off its row.
  function rowStep(from: number, dir: 1 | -1) {
    const slots = ordered.map((i) => buttons.current.get(i.id)?.parentElement);
    const at = slots[from];
    if (!at) return from;
    const rows = [...new Set(slots.map((s) => s?.offsetTop ?? 0))].sort((a, b) => a - b);
    const row = rows[rows.indexOf(at.offsetTop) + dir];
    if (row === undefined) return from;
    const mid = (s: HTMLElement) => s.offsetLeft + s.offsetWidth / 2;
    let best = from;
    let gap = Infinity;
    slots.forEach((s, j) => {
      if (s?.offsetTop !== row || Math.abs(mid(s) - mid(at)) >= gap) return;
      best = j;
      gap = Math.abs(mid(s) - mid(at));
    });
    return best;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") return setPinned(null);
    const from = ordered.findIndex((i) => i.id === stop);
    if (!MOVES.has(e.key) || from < 0) return;
    e.preventDefault();
    const to =
      e.key === "Home" ? 0
      : e.key === "End" ? ordered.length - 1
      : e.key === "ArrowLeft" ? Math.max(0, from - 1)
      : e.key === "ArrowRight" ? Math.min(ordered.length - 1, from + 1)
      : rowStep(from, e.key === "ArrowDown" ? 1 : -1);
    buttons.current.get(ordered[to].id)?.focus();
  }

  return (
    <div className={styles.interests} onBlur={blurAll}>
      <div className={styles.panel}>
        {/* Every entry sits in the one cell, so the panel stands as tall as
            its longest and the grid below never moves under the pointer. */}
        <div className={styles.stack}>
          <div className={styles.entry} data-shown={!current || undefined}>
            <div className={styles.entryText}>
              <div className={styles.introBody}>{intro}</div>
              <p className={styles.hint}>
                <span className={styles.hintPointer}>Hover a badge to read about it. Click to pin it here.</span>
                <span className={styles.hintTouch}>Tap a badge to read about it.</span>
              </p>
            </div>
          </div>

          {items.map((item) => {
            const related = item.related.flatMap((id) => byId.get(id)?.label ?? []);
            return (
              <div key={item.id} className={styles.entry} data-shown={item.id === currentId || undefined}>
                <span className={styles.entryIcon} aria-hidden="true">{item.icon}</span>
                <div className={styles.entryText}>
                  <div className={styles.entryHead}>
                    <h3 className={styles.entryTitle}>{item.label}</h3>
                    {item.id === pinned && <span className={styles.pinMark}>Pinned</span>}
                  </div>
                  <p id={`${uid}-${item.id}`} className={styles.entryBody}>{item.description}</p>
                  {item.link && (
                    <QuietLink href={item.link.href} arrow prefetch={false} className={styles.entryLink}>
                      {item.link.label}
                    </QuietLink>
                  )}
                  {related.length > 0 && (
                    <div className={styles.entryRelated}>
                      <span className={styles.relatedLabel}>Related</span>
                      <Stamps items={related} label={`Related to ${item.label}`} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ul className={styles.grid} role="toolbar" aria-label="Interests" onPointerLeave={leaveGrid} onKeyDown={onKeyDown}>
        {ordered.map((item) => (
          <li key={item.id} role="none">
            <button
              ref={(el) => {
                if (el) buttons.current.set(item.id, el);
                else buttons.current.delete(item.id);
              }}
              type="button"
              tabIndex={item.id === stop ? 0 : -1}
              className={styles.badge}
              data-state={stateOf(item.id)}
              aria-pressed={item.id === pinned}
              aria-describedby={`${uid}-${item.id}`}
              onPointerEnter={(e) => !isTouch(e) && setPreview(item.id)}
              onFocus={(e) => {
                setStop(item.id);
                if (fromKeyboard(e.currentTarget)) setPreview(item.id);
              }}
              onClick={() => {
                setStop(item.id);
                setPinned((p) => (p === item.id ? null : item.id));
              }}
            >
              <span className={styles.badgeIcon} aria-hidden="true">{item.icon}</span>
              <span className={styles.badgeLabel}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
