"use client";

// The font picker (/font-picker): a site page in a frame, with its three font
// roles (headlines, body, labels) swapped for Google Fonts families picked in
// the sidebar. Nothing on the site changes: the families load into the
// framed page under aliases (fonts.ts) and its --font-* variables are pointed
// at them, so every page, and every link inside the frame, works as it is.
// The game's own face (gameFont.ts) is left alone.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  FAMILIES,
  PAIRINGS,
  SLOTS,
  aliasFor,
  cssUrl,
  defaultPick,
  faceCss,
  hasItalic,
  kindLabel,
  samePicks,
  summary,
  weightsFor,
  type Family,
  type Pick,
  type Picks,
  type Slot,
} from "./fonts";
import styles from "./FontPicker.module.css";

const PAGES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/projects/to-arms-squire", label: "Case study" },
  { path: "/game", label: "Game" },
] as const;

type Width = "wide" | "phone";

/** What a reload keeps (this browser only). */
interface Saved {
  picks: Picks;
  path: string;
  width: Width;
  tried: Family[];
}

const STORE = "font-picker";
const DEFAULT: Saved = { picks: PAIRINGS[0].picks, path: "/", width: "wide", tried: [] };

// The same fallbacks as globals.css.
const FALLBACK: Record<Slot, string> = {
  display: "Georgia, serif",
  body: "system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, Menlo, monospace",
};

function readSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return DEFAULT;
    const s = JSON.parse(raw) as Partial<Saved>;
    const valid = (p?: Picks): p is Picks =>
      !!p && SLOTS.every(({ id }) => typeof p[id]?.family === "string" && typeof p[id]?.weight === "number" && typeof p[id]?.size === "number");
    return {
      picks: valid(s.picks) ? s.picks : DEFAULT.picks,
      path: typeof s.path === "string" && s.path.startsWith("/") && !s.path.startsWith("/font-picker") ? s.path : "/",
      width: s.width === "phone" ? "phone" : "wide",
      tried: Array.isArray(s.tried) ? s.tried.filter((f) => typeof f?.name === "string" && Array.isArray(f.w)) : [],
    };
  } catch {
    return DEFAULT;
  }
}

// Google's CSS, fetched once per request.
const sheets = new Map<string, Promise<string>>();
function googleCss(url: string): Promise<string> {
  let sheet = sheets.get(url);
  if (!sheet) {
    sheet = fetch(url).then((r) => {
      if (!r.ok) throw new Error(r.status === 400 ? "Google Fonts doesn't have that style" : `Google Fonts answered ${r.status}`);
      return r.text();
    });
    sheet.catch(() => sheets.delete(url));
    sheets.set(url, sheet);
  }
  return sheet;
}

function writeStyle(doc: Document, id: string, css: string) {
  let el = doc.getElementById(id);
  if (!el) {
    el = doc.createElement("style");
    el.id = id;
    doc.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

/** Puts a pick's faces into `doc` under its alias and waits for them to
    load, so a switch never flashes the fallback. */
async function loadPick(doc: Document, slot: Slot, p: Pick, f: Family | undefined): Promise<string> {
  const alias = aliasFor(slot, p);
  const id = `fp-face-${alias}`;
  if (!doc.getElementById(id)) writeStyle(doc, id, faceCss(await googleCss(cssUrl(slot, p, f)), alias, p.size));
  const w = slot === "body" ? 400 : p.weight;
  await Promise.all(
    [`${w} 1em '${alias}'`, `italic ${w} 1em '${alias}'`].map((font) => doc.fonts.load(font, "Hello, I'm Allen").catch(() => [])),
  );
  return alias;
}

const clampSize = (s: number) => Math.min(1.6, Math.max(0.6, Math.round(s * 100) / 100));
const typing = (t: EventTarget | null) => !!(t as Element | null)?.closest?.("input, select, textarea, [contenteditable='true']");

export default function FontPicker() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [picks, setPicks] = useState<Picks>(DEFAULT.picks);
  // The frame's first page, and the page it's on now (links inside it work).
  const [start, setStart] = useState("/");
  const [here, setHere] = useState("/");
  const [width, setWidth] = useState<Width>("wide");
  const [tried, setTried] = useState<Family[]>([]);
  const [comparing, setComparing] = useState(false);
  const [covered, setCovered] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Slot, string>>>({});
  const [nameFonts, setNameFonts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [catalog, setCatalog] = useState<Family[] | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [query, setQuery] = useState("");

  const picksRef = useRef(picks);
  const comparingRef = useRef(false);
  const applied = useRef<Partial<Record<Slot, string>>>({});
  const appliedWeight = useRef(PAIRINGS[0].picks.display.weight);
  const gen = useRef(0);

  const known = useMemo(() => {
    const m = new Map<string, Family>();
    for (const f of catalog ?? []) m.set(f.name, f);
    for (const f of tried) m.set(f.name, f);
    for (const f of FAMILIES) m.set(f.name, f);
    return m;
  }, [catalog, tried]);

  const active = PAIRINGS.find((p) => samePicks(p.picks, picks));

  // The select's families: the shortlist by kind, then anything searched up.
  const groups = useMemo(() => {
    const out: { label: string; families: string[] }[] = [];
    for (const f of FAMILIES) {
      const label = kindLabel(f.kind);
      const g = out.find((x) => x.label === label) ?? out[out.push({ label, families: [] }) - 1];
      g.families.push(f.name);
    }
    const extra = tried.filter((f) => !FAMILIES.some((x) => x.name === f.name)).map((f) => f.name);
    if (extra.length) out.push({ label: "Searched", families: extra });
    return out;
  }, [tried]);

  // ---- The framed page ----

  const writeVars = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.head) return;
    const a = applied.current;
    const lines = SLOTS.filter(({ id }) => a[id]).map(({ id }) => `  --font-${id}: '${a[id]}', ${FALLBACK[id]} !important;`);
    // The headlines ask for the weight that was loaded (--weight-display).
    if (lines.length) lines.push(`  --weight-display: ${appliedWeight.current} !important;`);
    writeStyle(doc, "fp-vars", comparingRef.current || !lines.length ? "" : `:root {\n${lines.join("\n")}\n}`);
  }, []);

  const applyFonts = useCallback(
    async (next: Picks) => {
      const doc = frame.current?.contentDocument;
      if (!doc?.head || doc.URL === "about:blank") return;
      const g = ++gen.current;
      setLoading(true);
      const errs: Partial<Record<Slot, string>> = {};
      const aliases = await Promise.all(
        SLOTS.map(({ id }) =>
          loadPick(doc, id, next[id], known.get(next[id].family)).catch((e: unknown) => {
            errs[id] = e instanceof Error ? e.message : String(e);
            return undefined;
          }),
        ),
      );
      if (g !== gen.current || frame.current?.contentDocument !== doc) return;
      SLOTS.forEach(({ id }, k) => {
        const alias = aliases[k];
        if (alias) applied.current[id] = alias;
      });
      if (aliases[0]) appliedWeight.current = next.display.weight;
      setErrors(errs);
      setLoading(false);
      writeVars();
    },
    [known, writeVars],
  );

  const step = useCallback((dir: number) => {
    const n = PAIRINGS.length;
    const i = PAIRINGS.findIndex((p) => samePicks(p.picks, picksRef.current));
    setPicks(PAIRINGS[i < 0 ? (dir > 0 ? 0 : n - 1) : (i + dir + n) % n].picks);
  }, []);

  // ← → step through the pairings and T holds the site's own fonts, from the
  // sidebar or the framed page (but not the game, which has keys of its own).
  const keyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (e.key === "t" || e.key === "T") {
        if (!e.repeat) setComparing(true);
        return;
      }
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      const inGame = (e.target as Node | null)?.ownerDocument !== document && frame.current?.contentWindow?.location.pathname.startsWith("/game");
      if (inGame) return;
      e.preventDefault();
      step(dir);
    },
    [step],
  );
  const keyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "t" || e.key === "T") setComparing(false);
  }, []);

  const onFrameLoad = useCallback(async () => {
    try {
      const win = frame.current?.contentWindow;
      // A link off the site leaves nothing to restyle (and nothing to reach).
      if (win && frame.current?.contentDocument) {
        win.addEventListener("keydown", keyDown);
        win.addEventListener("keyup", keyUp);
        await applyFonts(picksRef.current);
      }
    } finally {
      setCovered(false);
    }
  }, [applyFonts, keyDown, keyUp]);

  const go = (path: string) => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    setCovered(true);
    win.location.assign(path);
    // A page that never loads shouldn't stay hidden.
    window.setTimeout(() => setCovered(false), 6000);
  };

  // ---- Effects ----

  useEffect(() => {
    const s = readSaved();
    // The first page shouldn't stay hidden if it never loads either.
    window.setTimeout(() => setCovered(false), 6000);
    setPicks(s.picks);
    setStart(s.path);
    setHere(s.path);
    setWidth(s.width);
    setTried(s.tried);
    setReady(true);
  }, []);

  useEffect(() => {
    picksRef.current = picks;
    if (ready) void applyFonts(picks);
  }, [ready, picks, applyFonts]);

  useEffect(() => {
    comparingRef.current = comparing;
    writeVars();
  }, [comparing, writeVars]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ picks, path: here, width, tried } satisfies Saved));
    } catch {
      // Storage off (a private window): the picker still works, it just forgets.
    }
  }, [ready, picks, here, width, tried]);

  // Follow the frame's own navigation, and put the fonts back if a full
  // reload inside it dropped them.
  useEffect(() => {
    if (!ready) return;
    const t = window.setInterval(() => {
      const doc = frame.current?.contentDocument;
      const win = frame.current?.contentWindow;
      if (!doc || !win || doc.URL === "about:blank" || doc.readyState === "loading") return;
      setHere(win.location.pathname + win.location.search);
      if (!doc.getElementById("fp-vars")) void applyFonts(picksRef.current);
    }, 700);
    return () => window.clearInterval(t);
  }, [ready, applyFonts]);

  useEffect(() => {
    const release = () => setComparing(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", release);
    };
  }, [keyDown, keyUp]);

  // Each pairing's name, set in its own headline font.
  useEffect(() => {
    let live = true;
    for (const p of PAIRINGS) {
      const d = p.picks.display;
      loadPick(document, "display", { ...d, size: 1 }, FAMILIES.find((f) => f.name === d.family))
        .then((alias) => live && setNameFonts((m) => ({ ...m, [p.id]: alias })))
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, []);

  // ---- Choosing ----

  const choose = (slot: Slot, name: string) => {
    const f = known.get(name);
    setPicks((prev) => ({ ...prev, [slot]: f ? defaultPick(f, slot) : { family: name, weight: 400, size: 1 } }));
  };

  const tweak = (slot: Slot, patch: Partial<Pick>) =>
    setPicks((prev) => {
      const p = { ...prev[slot], ...patch };
      return { ...prev, [slot]: { ...p, size: clampSize(p.size) } };
    });

  const catalogAsked = useRef(false);
  const loadCatalog = useCallback(() => {
    if (catalogAsked.current) return;
    catalogAsked.current = true;
    fetch("/font-picker/catalog")
      .then((r) => (r.ok ? (r.json() as Promise<Family[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setCatalog)
      .catch(() => {
        catalogAsked.current = false;
        setCatalogFailed(true);
      });
  }, []);

  // The search's list (about 120 KB), fetched once the page has settled.
  useEffect(() => {
    const t = window.setTimeout(loadCatalog, 1500);
    return () => window.clearTimeout(t);
  }, [loadCatalog]);

  const q = query.trim().toLowerCase();
  const found = q ? catalog?.find((f) => f.name.toLowerCase() === q) : undefined;
  const partial = q && catalog ? catalog.some((f) => f.name.toLowerCase().includes(q)) : false;

  const takeFound = (slot: Slot) => {
    if (!found) return;
    if (!FAMILIES.some((f) => f.name === found.name)) setTried((t) => [...t.filter((f) => f.name !== found.name), found]);
    setPicks((prev) => ({ ...prev, [slot]: defaultPick(found, slot) }));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary(picks, active));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // No clipboard: the line is on screen to copy by hand.
    }
  };

  const holdKeys = (on: boolean) => (e: ReactKeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    setComparing(on);
  };

  const herePath = here.split("?")[0];

  return (
    <div className={`${styles.app} ${width === "phone" ? styles.phone : ""}`}>
      <aside className={styles.side}>
        <header className={styles.head}>
          <h1 className={styles.title}>Font picker</h1>
          <p className={styles.help}>
            Pick a pairing and the page on the right switches to it. <kbd>←</kbd> <kbd>→</kbd> step through them;
            hold <kbd>T</kbd> to see the site&apos;s own fonts.
          </p>
        </header>

        <section aria-labelledby="fp-pairings">
          <h2 id="fp-pairings" className={styles.label}>Pairings</h2>
          <ul className={styles.pairings}>
            {PAIRINGS.map((p) => {
              const on = active?.id === p.id;
              return (
                <li key={p.id}>
                  <button type="button" className={styles.pairing} aria-pressed={on} onClick={() => setPicks(p.picks)}>
                    <span className={styles.pairingHead}>
                      <span
                        className={styles.pairingName}
                        style={nameFonts[p.id] ? { fontFamily: `'${nameFonts[p.id]}', Georgia, serif` } : undefined}
                      >
                        {p.name}
                      </span>
                      {p.live && <span className={styles.top}>On the site</span>}
                    </span>
                    <span className={styles.pairingFonts}>{SLOTS.map(({ id }) => p.picks[id].family).join(" · ")}</span>
                    {on && <span className={styles.blurb}>{p.blurb}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="fp-mix">
          <h2 id="fp-mix" className={styles.label}>{active ? "Mix and match" : "Your mix"}</h2>
          <div className={styles.slots}>
            {SLOTS.map(({ id, label, what }) => {
              const p = picks[id];
              const f = known.get(p.family);
              const note = errors[id]
                ? `Couldn't load: ${errors[id]}.`
                : id === "display" && !hasItalic(f, p.weight)
                  ? "No italic: the browser slants “Allen” itself."
                  : what;
              return (
                <div key={id} className={styles.slot}>
                  <label className={styles.slotName} htmlFor={`fp-${id}`}>{label}</label>
                  <select id={`fp-${id}`} className={styles.family} value={p.family} onChange={(e) => choose(id, e.target.value)}>
                    {!known.has(p.family) && <option>{p.family}</option>}
                    {groups.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.families.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className={styles.knobs}>
                    {id !== "body" && (
                      <select
                        aria-label={`${label} weight`}
                        className={styles.weight}
                        value={p.weight}
                        onChange={(e) => tweak(id, { weight: Number(e.target.value) })}
                      >
                        {weightsFor(f).map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    )}
                    <span className={styles.stepper}>
                      <button type="button" aria-label={`${label} smaller`} onClick={() => tweak(id, { size: p.size - 0.05 })}>−</button>
                      <output aria-label={`${label} size`}>{Math.round(p.size * 100)}%</output>
                      <button type="button" aria-label={`${label} larger`} onClick={() => tweak(id, { size: p.size + 0.05 })}>+</button>
                    </span>
                  </div>
                  <p className={errors[id] ? `${styles.note} ${styles.error}` : styles.note}>{note}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="fp-any">
          <h2 id="fp-any" className={styles.label}>Any Google font</h2>
          <input
            type="search"
            className={styles.search}
            list="fp-catalog"
            placeholder={catalog ? `Search ${catalog.length.toLocaleString()} families` : "Search Google Fonts"}
            value={query}
            onFocus={loadCatalog}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search Google Fonts"
          />
          <datalist id="fp-catalog">
            {catalog?.map((f) => (
              <option key={f.name} value={f.name} />
            ))}
          </datalist>
          {found ? (
            <div className={styles.useFor}>
              <span>Use for</span>
              {SLOTS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => takeFound(id)}>{label.toLowerCase()}</button>
              ))}
            </div>
          ) : (
            <p className={styles.note}>
              {catalogFailed
                ? "Couldn't reach Google Fonts."
                : q && catalog && !partial
                  ? "No family by that name."
                  : "For anything not on the lists above."}
            </p>
          )}
        </section>

        <footer className={styles.foot}>
          <p className={styles.summary}>{summary(picks, active)}</p>
          <button type="button" className={styles.copy} onClick={copy}>{copied ? "Copied" : "Copy my pick"}</button>
        </footer>
      </aside>

      <div className={styles.preview}>
        <div className={styles.toolbar}>
          <div className={styles.seg} role="group" aria-label="Page">
            {PAGES.map((pg) => (
              <button key={pg.path} type="button" aria-pressed={herePath === pg.path} onClick={() => go(pg.path)}>
                {pg.label}
              </button>
            ))}
          </div>
          <div className={styles.seg} role="group" aria-label="Width">
            <button type="button" aria-pressed={width === "wide"} onClick={() => setWidth("wide")}>Wide</button>
            <button type="button" aria-pressed={width === "phone"} onClick={() => setWidth("phone")}>Phone</button>
          </div>
          <span className={styles.status} aria-live="polite">
            {comparing ? "Showing the site's fonts" : loading ? "Loading fonts…" : ""}
          </span>
          <button
            type="button"
            className={styles.hold}
            aria-pressed={comparing}
            onPointerDown={() => setComparing(true)}
            onPointerUp={() => setComparing(false)}
            onPointerLeave={() => setComparing(false)}
            onPointerCancel={() => setComparing(false)}
            onKeyDown={holdKeys(true)}
            onKeyUp={holdKeys(false)}
          >
            Hold for the site&apos;s fonts
          </button>
        </div>
        <div className={styles.stage}>
          {ready && (
            <iframe
              ref={frame}
              src={start}
              title="The site, in the fonts picked"
              className={styles.frame}
              data-covered={covered}
              onLoad={onFrameLoad}
            />
          )}
        </div>
      </div>
    </div>
  );
}
