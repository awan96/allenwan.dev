"use client";

// Standalone sprite workbench for every pixel library on the site.
//
// Pick a target file (game icons, game art, site sprites), paint a grid of
// any size up to 64×64 with the pencil, the fill or the square (paintTools.ts),
// remap role letters A–H onto that file's palette, and copy or (in dev) save
// the result straight into the target file. Saves hot-reload: the dev server
// rewrites the module, so the new sprite shows up in "Load existing" — and
// anywhere the site renders it — a moment later.
//
// Ideas to build next, in rough difficulty order:
//   TODO: mirror-X mode for symmetric sprites (paint (x,y) and (w-1-x,y))
//   TODO: keyboard shortcuts — 1..9 select tool, arrows shift
//   TODO: import a PNG (canvas.getImageData → nearest palette color)

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpriteSvg from "@/components/pixel/SpriteSvg";
import { ROLE_LETTERS, type RoleLetter, type RoleMap } from "@/components/pixel/roles";
import { TARGETS, getTarget, MIN_SIZE, MAX_SIZE, type SpriteTarget } from "@/components/pixel/targets";
import { fillRect, floodFill, inRect, type Cell } from "./paintTools";
import styles from "./SpriteEditor.module.css";

type Tool = "." | "o" | RoleLetter;
type Mode = "pencil" | "fill" | "square";

const MODE_HINTS: Record<Mode, string> = {
  pencil: "pencil: click or drag to paint",
  fill: "fill: click an area to fill it — a one-pixel gap in an outline won't leak",
  square: "square: click one corner, then the opposite one",
};

const emptyGrid = (width: number, height: number): string[] =>
  Array.from({ length: height }, () => ".".repeat(width));

const lettersInGrid = (grid: string[]): RoleLetter[] =>
  ROLE_LETTERS.filter((l) => grid.some((row) => row.includes(l)));

/** Draft-commit number input: applies on blur/Enter so half-typed values
    (the "2" on the way to "24") never resize the canvas. */
function SizeField({ label, value, disabled, onCommit }: {
  label: string; value: number; disabled?: boolean; onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && draft.trim() !== "") {
      const clamped = Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
      setDraft(String(clamped));
      onCommit(clamped);
    } else {
      setDraft(String(value));
    }
  };
  return (
    <input
      type="number"
      min={MIN_SIZE}
      max={MAX_SIZE}
      value={draft}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
    />
  );
}

/** The copy-paste payload: a GRIDS entry plus its ICON_ROLES line for the
    target file. Formatting mirrors spliceSprite() in the dev save route —
    keep them in sync so a re-save of an unedited sprite is a no-op. */
function toCode(name: string, grid: string[], roles: RoleMap): string {
  const gridEntry = `  ${name}: [\n${grid.map((row) => `    "${row}",`).join("\n")}\n  ],\n`;
  const rolesString = ROLE_LETTERS
    .filter((key) => grid.some((row) => row.includes(key)))
    .map((key) => `${key}: "${roles[key]}"`)
    .join(", ");
  const paddedName = `${name}:`.padEnd(Math.max(10, name.length + 2));
  const rolesEntry = `  ${paddedName}{ ${rolesString} },`;
  return `${gridEntry}\n${rolesEntry}`;
}

export default function SpriteEditor() {
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const target: SpriteTarget = getTarget(targetId) ?? TARGETS[0];

  const [name, setName] = useState("new_sprite");
  const [grid, setGrid] = useState<string[]>(() =>
    emptyGrid(TARGETS[0].defaultSize.width, TARGETS[0].defaultSize.height)
  );
  const [roles, setRoles] = useState<RoleMap>(TARGETS[0].defaultRoles);
  const [activeLetters, setActiveLetters] = useState<RoleLetter[]>(
    () => ROLE_LETTERS.filter((l) => l in TARGETS[0].defaultRoles)
  );
  const [tool, setTool] = useState<Tool>("A");
  // How a click paints: the pencil (click and drag), the fill, or the square
  // (one corner, then the other). `anchor` is the square's first corner;
  // `hover` is the cell under the pointer while one is set, for the preview.
  const [mode, setMode] = useState<Mode>("pencil");
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);

  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const paletteKeys = Object.keys(target.palette);

  // History is one entry per completed *change* (a full paint stroke, a clear,
  // a resize, a sprite load) — never per pixel. The stroke's pre-state is
  // snapshotted in a ref at pointerdown and committed once at pointerup; a ref
  // mirror of `grid` lets the commit read the post-stroke state without stale
  // closures.
  const strokeStart = useRef<string[] | null>(null);
  const gridRef = useRef<string[]>([]);
  useEffect(() => { gridRef.current = grid; }, [grid]);

  const pushUndo = useCallback((snapshot: string[]) => {
    setUndoStack((s) => [...s, snapshot]);
    setRedoStack([]); // a new change invalidates the redo branch
  }, []);

  /** Replace the grid wholesale (clear, load, resize) as one undoable change. */
  const applyGrid = (next: string[]) => {
    if (next.join("\n") !== grid.join("\n")) pushUndo(grid);
    setGrid(next);
  };

  const clear = () => applyGrid(emptyGrid(width, height));

  /** Everything about the workbench is per-target — switching files starts a
      fresh canvas against that file's palette. */
  const switchTarget = (id: string) => {
    const next = getTarget(id);
    if (!next) return;
    setTargetId(id);
    setGrid(emptyGrid(next.defaultSize.width, next.defaultSize.height));
    setRoles(next.defaultRoles);
    setActiveLetters(ROLE_LETTERS.filter((l) => l in next.defaultRoles));
    setTool("A");
    setAnchor(null);
    setUndoStack([]);
    setRedoStack([]);
    setSaveError(null);
  };

  const loadSprite = (key: string) => {
    const src = target.grids[key];
    if (!src) return;
    setName(key);
    setAnchor(null);
    applyGrid([...src]);
    const spriteRoles = target.roles[key] ?? {};
    const letters = lettersInGrid(src);
    const active = letters.length > 0
      ? letters
      : ROLE_LETTERS.filter((l) => l in target.defaultRoles);
    setActiveLetters(active);
    // every active letter needs a color — fall back to the first palette key
    const filled: RoleMap = {};
    for (const l of active) filled[l] = spriteRoles[l] ?? paletteKeys[0];
    setRoles({ ...target.defaultRoles, ...filled });
    if (tool !== "." && tool !== "o" && !active.includes(tool)) setTool(active[0] ?? "A");
  };

  /** Crop/pad to the new dimensions, anchored top-left. */
  const resize = (w: number, h: number) => {
    const next = Array.from({ length: h }, (_, y) =>
      (grid[y] ?? "").slice(0, w).padEnd(w, ".")
    );
    setAnchor(null);
    applyGrid(next);
  };

  const addRole = () => {
    const nextLetter = ROLE_LETTERS.find((l) => !activeLetters.includes(l));
    if (!nextLetter) return;
    setActiveLetters([...activeLetters, nextLetter]);
    setRoles({ ...roles, [nextLetter]: paletteKeys[0] });
    setTool(nextLetter);
  };

  const code = useMemo(() => toCode(name, grid, roles), [name, grid, roles]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const undo = () => {
    const prev = undoStack.at(-1);
    if (!prev) return;
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, grid]);
    setGrid(prev);
  };

  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, grid]);
    setGrid(next);
  };

  /** Shift the whole sprite by (dx, dy) — content moves in that direction,
      wrapping at the edges. Each pixel pulls from its source position. */
  const shift = (dx: number, dy: number) => {
    const next = grid.map((_, y) => {
      const srcRow = grid[(y - dy + height) % height];
      return srcRow
        .split("")
        .map((_, x) => srcRow[(x - dx + width) % width])
        .join("");
    });
    applyGrid(next);
  };

  const flipHorizontal = () =>
    applyGrid(grid.map((row) => row.split("").reverse().join("")));

  // .reverse() mutates, so copy first — reversing `grid` in place would
  // silently edit React state behind its back.
  const flipVertical = () => applyGrid([...grid].reverse());

  const chooseMode = (next: Mode) => {
    setMode(next);
    setAnchor(null);
  };

  // The fill and the square each land as one undoable change; the pencil
  // paints a stroke that is committed when the pointer lifts.
  const canvasPointerDown = (x: number, y: number) => {
    if (mode === "fill") {
      applyGrid(floodFill(grid, x, y, tool));
      return;
    }
    if (mode === "square") {
      if (!anchor) {
        setAnchor({ x, y });
        setHover({ x, y });
        return;
      }
      applyGrid(fillRect(grid, anchor, { x, y }, tool));
      setAnchor(null);
      return;
    }
    strokeStart.current = grid; // snapshot the pre-stroke state
    setIsPainting(true);
    drawAt(x, y);
  };

  const canvasPointerEnter = (x: number, y: number) => {
    if (anchor) setHover({ x, y });
    if (!isPainting) return;
    drawAt(x, y);
  };

  // Esc lets go of a half-made square.
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAnchor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anchor]);

  const drawAt = (x: number, y: number) => {
    // Functional update: during a drag, several pointerenter events can fire
    // before React re-renders, so reading `grid` from the closure would paint
    // onto a stale copy and drop pixels.
    setGrid((g) => {
      const newGrid = [...g];
      newGrid[y] = g[y].slice(0, x) + tool + g[y].slice(x + 1);
      return newGrid;
    });
  };

  // Commit the stroke as a single undo entry — and only if it actually
  // changed something, so repainting a pixel with its own color records
  // nothing.
  const endStroke = useCallback(() => {
    const start = strokeStart.current;
    strokeStart.current = null;
    if (!start) return;
    if (start.join("\n") !== gridRef.current.join("\n")) pushUndo(start);
  }, [pushUndo]);

  // End the stroke wherever the pointer is released, including outside the
  // canvas. Registered once (with cleanup) — attaching in the render body
  // would stack a fresh listener on every render and crash server rendering,
  // where `window` doesn't exist.
  useEffect(() => {
    const stop = () => {
      setIsPainting(false);
      endStroke();
    };
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, [endStroke]);

  // Writes straight into the target file via the dev-only API route; HMR then
  // reloads the module, so the saved sprite shows up in "Load existing" (and
  // anywhere the site renders it) by itself.
  const save = async () => {
    setSaveError(null);
    try {
      const usedLetters = lettersInGrid(grid);
      const res = await fetch("/api/dev/sprites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetId,
          name,
          grid,
          roles: Object.fromEntries(usedLetters.map((l) => [l, roles[l]])),
        }),
      });
      // fetch only rejects on network failure — an HTTP 4xx still resolves,
      // so success is res.ok, and the body carries the message.
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveError(body?.error ?? `save failed (${res.status})`);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setSaveError("network error — is the dev server running?");
    }
  };

  const colorFor = (ch: string): string | null => {
    if (ch === "o") return target.palette.outline ?? null;
    const role = roles[ch as RoleLetter];
    return role ? target.palette[role] ?? null : null;
  };

  // Cell size scales down as grids grow so the canvas stays on screen.
  const cell = Math.max(8, Math.min(28, Math.floor(600 / Math.max(width, height))));

  // Preview scale: roughly "actual" and "double", smaller for huge grids.
  const maxDim = Math.max(width, height);
  const bigScale = maxDim <= 24 ? 4 : maxDim <= 48 ? 3 : 2;

  const toolLabel = (t: Tool) =>
    t === "." ? "erase" : t === "o" ? "outline" : `${t} · ${roles[t] ?? "?"}`;

  const fileName = target.file.split("/").pop();

  return (
    <div className={styles.shell}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>Sprite Editor</h1>
          <p className={styles.subtitle}>
            Paint a sprite, then save the code into <code>{target.file}</code>.
          </p>
        </header>

        <div className={styles.columns}>
          {/* ---- canvas ---- */}
          <section>
            <div
              className={styles.canvas}
              style={{
                ["--cell" as string]: `${cell}px`,
                gridTemplateColumns: `repeat(${width}, var(--cell))`,
              }}
            >
              {grid.flatMap((row, y) =>
                row.split("").map((ch, x) => {
                  // A square in the making shows what it will paint.
                  const previewing = !!anchor && !!hover && inRect(anchor, hover, x, y);
                  const isAnchor = anchor?.x === x && anchor?.y === y;
                  const fill = colorFor(previewing ? tool : ch);
                  return (
                    <button
                      key={`${x}_${y}`}
                      className={`${styles.px} ${previewing ? styles.pxPreview : ""} ${isAnchor ? styles.pxAnchor : ""}`}
                      onPointerDown={() => canvasPointerDown(x, y)}
                      onPointerEnter={() => canvasPointerEnter(x, y)}
                      // Only paint over the checkerboard when the pixel is set —
                      // an explicit "transparent" background would hide it.
                      style={fill ? { background: fill } : undefined}
                    />
                  );
                })
              )}
            </div>

            <div className={styles.tools}>
              <div className={styles.toolGroup} role="group" aria-label="Paint with">
                {(["pencil", "fill", "square"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.tool} ${mode === m ? styles.toolActive : ""}`}
                    aria-pressed={mode === m}
                    onClick={() => chooseMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {([".", "o", ...activeLetters] as Tool[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.tool} ${tool === t ? styles.toolActive : ""}`}
                  onClick={() => setTool(t)}
                >
                  <span
                    className={styles.toolSwatch}
                    style={{ background: colorFor(t) ?? "transparent" }}
                  />
                  {toolLabel(t)}
                </button>
              ))}
              {activeLetters.length < ROLE_LETTERS.length && (
                <button type="button" className={styles.tool} onClick={addRole}>
                  + color
                </button>
              )}
            </div>
            <div className={styles.tools}>
              <div className={styles.toolGroup} role="group" aria-label="Shift and flip">
                <button type="button" className={styles.tool} title="Shift left" aria-label="Shift left" onClick={() => shift(-1, 0)}>←</button>
                <button type="button" className={styles.tool} title="Shift up" aria-label="Shift up" onClick={() => shift(0, -1)}>↑</button>
                <button type="button" className={styles.tool} title="Shift down" aria-label="Shift down" onClick={() => shift(0, 1)}>↓</button>
                <button type="button" className={styles.tool} title="Shift right" aria-label="Shift right" onClick={() => shift(1, 0)}>→</button>
                <button type="button" className={styles.tool} title="Flip horizontally" aria-label="Flip horizontally" onClick={flipHorizontal}>flip ↔</button>
                <button type="button" className={styles.tool} title="Flip vertically" aria-label="Flip vertically" onClick={flipVertical}>flip ↕</button>
              </div>
              <div className={styles.toolGroup} role="group" aria-label="History">
                <button type="button" className={styles.tool} onClick={undo} disabled={undoStack.length === 0}>
                  undo
                </button>
                <button type="button" className={styles.tool} onClick={redo} disabled={redoStack.length === 0}>
                  redo
                </button>
              </div>
              <button type="button" className={`${styles.tool} ${styles.toolDanger}`} onClick={clear}>
                clear
              </button>
            </div>
            <p className={styles.toolHint}>
              {mode === "square" && anchor ? "square: now click the opposite corner (Esc cancels)" : MODE_HINTS[mode]}
            </p>
          </section>

          {/* ---- controls + output ---- */}
          <section className={styles.side}>
            <label className={styles.field}>
              <span>Target file</span>
              <select value={targetId} onChange={(e) => switchTarget(e.target.value)}>
                {TARGETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>

            <label className={styles.field}>
              <span>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-z0-9_]/g, ""))}
              />
            </label>

            <div className={styles.field}>
              <span>Size (w × h)</span>
              <div className={styles.sizeRow}>
                <SizeField label="Width" value={width} disabled={!!target.fixedSize} onCommit={(w) => resize(w, height)} />
                <span className={styles.sizeTimes}>×</span>
                <SizeField label="Height" value={height} disabled={!!target.fixedSize} onCommit={(h) => resize(width, h)} />
              </div>
            </div>
            {target.fixedSize && (
              <p className={styles.hint}>
                size is locked — every sprite here is {target.fixedSize.width}×{target.fixedSize.height}
              </p>
            )}

            <label className={styles.field}>
              <span>Load existing</span>
              <select value="" onChange={(e) => loadSprite(e.target.value)}>
                <option value="" disabled>pick a sprite…</option>
                {Object.keys(target.grids).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>

            {activeLetters.map((r) => (
              <label key={r} className={styles.field}>
                <span>{r} · color</span>
                <select
                  value={roles[r] ?? paletteKeys[0]}
                  onChange={(e) => setRoles({ ...roles, [r]: e.target.value })}
                >
                  {paletteKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
            ))}

            <div className={styles.previews}>
              <figure>
                <SpriteSvg grid={grid} roles={roles} palette={target.palette} scale={2} />
                <figcaption>2×</figcaption>
              </figure>
              <figure>
                <SpriteSvg grid={grid} roles={roles} palette={target.palette} scale={bigScale} />
                <figcaption>{bigScale}×</figcaption>
              </figure>
              {target.mutedPalette && (
                <figure>
                  <SpriteSvg grid={grid} roles={roles} palette={target.palette} mutedPalette={target.mutedPalette} scale={bigScale} />
                  <figcaption>muted</figcaption>
                </figure>
              )}
              <figure>
                <SpriteSvg grid={grid} roles={roles} palette={target.palette} scale={bigScale} style={{ filter: "grayscale(1)" }} />
                <figcaption>gray</figcaption>
              </figure>
            </div>

            <textarea className={styles.code} readOnly value={code} rows={Math.min(height + 6, 24)} />
            <div className={styles.actionRow}>
              <button type="button" className={styles.copyBtn} onClick={copy}>
                {copied ? "Copied ✓" : "Copy code"}
              </button>
              {/* Direct file write only exists on the dev server */}
              {process.env.NODE_ENV === "development" && (
                <button type="button" className={`${styles.copyBtn} ${styles.ghostBtn}`} onClick={save}>
                  {saved ? "Saved ✓" : `Save to ${fileName}`}
                </button>
              )}
            </div>
            {saveError && <p className={styles.saveError} role="alert">{saveError}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
