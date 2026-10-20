// Dev-only endpoint: writes a sprite from the Sprite Editor directly into one
// of the registered sprite libraries (game icons, game art, site sprites).
// The dev server's file watcher picks up the write, so the new sprite
// hot-reloads into the running app (including the editor's own
// "Load existing" dropdown) a moment after saving.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getTarget, MIN_SIZE, MAX_SIZE, type SpriteTarget } from "@/components/pixel/targets";
import { ROLE_LETTERS, isRoleLetter, type RoleLetter } from "@/components/pixel/roles";

const NAME_RE = /^[a-z][a-z0-9_]*$/; // must be a valid identifier — also the code-injection guard

export type SpritePayload = {
  target: SpriteTarget;
  name: string;
  grid: string[];
  roles: Partial<Record<RoleLetter, string>>;
};

/** Treat the payload as hostile — it's going into source code. Write paths
    come only from the server-side target registry, never the client. */
function validate(body: unknown): { data?: SpritePayload; error?: string } {
  if (typeof body !== "object" || body === null) return { error: "body must be an object" };
  const { target: targetId, name, grid, roles } = body as Record<string, unknown>;

  if (typeof targetId !== "string") return { error: "target is required" };
  const target = getTarget(targetId);
  if (!target) return { error: `unknown target "${targetId}"` };

  if (typeof name !== "string" || !NAME_RE.test(name)) {
    return { error: "name must be a lowercase identifier (a-z, 0-9, _)" };
  }

  if (!Array.isArray(grid) || grid.length < MIN_SIZE || grid.length > MAX_SIZE) {
    return { error: `grid must be ${MIN_SIZE}–${MAX_SIZE} rows` };
  }
  const width = typeof grid[0] === "string" ? grid[0].length : 0;
  if (width < MIN_SIZE || width > MAX_SIZE) {
    return { error: `grid rows must be ${MIN_SIZE}–${MAX_SIZE} chars wide` };
  }
  const rowRe = new RegExp(`^[.oA-H]{${width}}$`);
  const badRow = grid.findIndex((r) => typeof r !== "string" || !rowRe.test(r));
  if (badRow !== -1) {
    return { error: `grid row ${badRow} must be exactly ${width} chars of . o A-H` };
  }
  if (target.fixedSize) {
    const { width: fw, height: fh } = target.fixedSize;
    if (width !== fw || grid.length !== fh) {
      return { error: `${target.label} sprites must be exactly ${fw}×${fh}` };
    }
  }

  if (typeof roles !== "object" || roles === null) return { error: "roles must be an object" };
  const paletteKeys = new Set(Object.keys(target.palette));
  for (const [key, value] of Object.entries(roles as Record<string, unknown>)) {
    if (!isRoleLetter(key)) return { error: `roles key "${key}" must be one of A-H` };
    if (typeof value !== "string" || !paletteKeys.has(value)) {
      return { error: `roles.${key} must be a palette color of ${target.label}` };
    }
  }
  // Every role letter painted into the grid needs a color to resolve to.
  for (const letter of ROLE_LETTERS) {
    const used = (grid as string[]).some((row) => row.includes(letter));
    if (used && !(letter in (roles as object))) {
      return { error: `grid uses "${letter}" but roles.${letter} is missing` };
    }
  }

  return {
    data: {
      target,
      name,
      grid: grid as string[],
      roles: roles as SpritePayload["roles"],
    },
  };
}

export async function POST(req: Request) {
  // Never a thing outside the dev server (deployed filesystems are read-only
  // anyway, but this should 404, not 500 — and never advertise itself).
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }

  const { data, error } = validate(body);
  if (!data) return NextResponse.json({ error }, { status: 400 });

  const filePath = path.join(process.cwd(), data.target.file);
  const source = await readFile(filePath, "utf8");

  let next: string;
  try {
    next = spliceSprite(source, data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }

  if (next === source) return NextResponse.json({ ok: true, changed: false });
  await writeFile(filePath, next, "utf8");
  return NextResponse.json({ ok: true, changed: true });
}

// An entry inside a block: its name plus every line it spans (one line for
// ICON_ROLES, height + 2 for a GRIDS entry).
type BlockEntry = { name: string; lines: string[] };

// Entries start at two-space indent with an identifier and a colon — grid
// rows (4-space indent, quoted) and closers (`  ],`) attach to the entry
// above them.
const ENTRY_START_RE = /^ {2}([a-z][a-z0-9_]*):/;

/** Locate the `export const <marker> ... = { … };` block; returns the
    [start, end) line range of its contents. Throws rather than guessing —
    a wrong write here corrupts hand-drawn sprites. */
function blockRange(lines: string[], marker: string): [number, number] {
  const open = lines.findIndex((l) => l.startsWith(`export const ${marker}`));
  if (open === -1) throw new Error(`could not find "export const ${marker}" in the target file`);
  // Check findIndex's result BEFORE adding the offset — a -1 folded into
  // `open + 1 + rel` masquerades as a valid index.
  const rel = lines.slice(open + 1).findIndex((l) => l.startsWith("};"));
  if (rel === -1) throw new Error(`could not find the closing "};" for ${marker}`);
  return [open + 1, open + 1 + rel];
}

function parseEntries(blockLines: string[], marker: string): BlockEntry[] {
  const entries: BlockEntry[] = [];
  for (const line of blockLines) {
    const start = ENTRY_START_RE.exec(line);
    if (start) entries.push({ name: start[1], lines: [line] });
    else if (entries.length > 0) entries.at(-1)!.lines.push(line);
    else if (line.trim() === "") continue;
    else throw new Error(`unexpected line in ${marker} block: ${line.trim()}`);
  }
  return entries;
}

/** Upsert an entry into a block and keep the block alphabetized. Mutates
    `lines` in place. Exact-name match — prefix matching would let a sprite
    named "st" overwrite "star". */
function upsertSorted(lines: string[], marker: string, name: string, entryLines: string[]) {
  const [from, to] = blockRange(lines, marker);
  const entries = parseEntries(lines.slice(from, to), marker);
  const existing = entries.findIndex((e) => e.name === name);
  if (existing === -1) entries.push({ name, lines: entryLines });
  else entries[existing] = { name, lines: entryLines };
  entries.sort((a, b) => a.name.localeCompare(b.name));
  lines.splice(from, to - from, ...entries.flatMap((e) => e.lines));
}

/**
 * Upsert `sprite` into both blocks of the target file, alphabetizing each
 * block. Pure: returns the new source; throws (→ 422) when the file doesn't
 * look like it expects. The handler owns all I/O.
 */
function spliceSprite(source: string, sprite: SpritePayload): string {
  const { name, grid, roles } = sprite;

  // Formatting mirrors toCode() in SpriteEditor.tsx — keep them in sync so a
  // re-save of an unedited sprite is a byte-identical no-op.
  const gridEntry = [`  ${name}: [`, ...grid.map((line) => `    "${line}",`), "  ],"];
  const rolesString = ROLE_LETTERS
    .filter((key) => grid.some((row) => row.includes(key)))
    .map((key) => `${key}: "${roles[key]}"`)
    .join(", ");
  const paddedName = `${name}:`.padEnd(Math.max(10, name.length + 2));
  const rolesEntry = `  ${paddedName}{ ${rolesString} },`;

  const lines = source.split("\n");
  upsertSorted(lines, "GRIDS", name, gridEntry);
  upsertSorted(lines, "ICON_ROLES", name, [rolesEntry]);
  return lines.join("\n");
}
