// src/lib/apple.ts
// The homepage apple (D2, ruled 2026-09-29): ONE apple, never a count.
//
//   tree   → hanging on the hero's tree; click to pick it
//   ground → it fell and rolled; click to pick it up
//   pocket → carried: it waits at the squire's feet in the game's windows
//            on the site (SquireApple) until the game eats it
//   used   → the game ate it at the start of a new run; the tree regrows
//            it REGROW_MS later
//
// One localStorage key holds the state, plus a timestamp while it regrows.
// No React here: the game store imports takePocketApple() directly.

export type AppleState = "tree" | "ground" | "pocket" | "used";

const KEY = "apple";
const USED_AT_KEY = "appleUsedAt";
const EVENT = "apple-change";

export const REGROW_MS = 10_000;

const STATES: readonly AppleState[] = ["tree", "ground", "pocket", "used"];

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The current state; "used" turns back into "tree" once the regrow is due. */
export function readApple(): AppleState {
  const s = storage();
  if (!s) return "tree";
  const raw = s.getItem(KEY) as AppleState | null;
  const state = raw && STATES.includes(raw) ? raw : "tree";
  if (state === "used" && regrowIn() === 0) return "tree";
  return state;
}

/** Milliseconds until a used apple grows back (0 when it's due or not used). */
export function regrowIn(): number {
  const s = storage();
  if (!s || s.getItem(KEY) !== "used") return 0;
  const at = Number(s.getItem(USED_AT_KEY) ?? 0);
  return Math.max(0, at + REGROW_MS - Date.now());
}

export function writeApple(next: AppleState): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, next);
    if (next === "used") s.setItem(USED_AT_KEY, String(Date.now()));
    else s.removeItem(USED_AT_KEY);
  } catch {
    // Storage full or blocked: the apple just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Calls back on any change, in this tab or another. */
export function subscribeApple(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** For the game: eat the carried apple if there is one. True = it was eaten. */
export function takePocketApple(): boolean {
  if (readApple() !== "pocket") return false;
  writeApple("used");
  return true;
}
