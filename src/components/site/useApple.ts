// src/components/site/useApple.ts
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readApple, regrowIn, subscribeApple, type AppleState } from "@/lib/apple";

// Server render knows nothing about the visitor's apple: null until mounted,
// so the tree, the ground and the squire's apple never flash the wrong state.
const serverSnapshot = () => null;

/** The apple's state, live across components and tabs; null on the server. */
export function useApple(): AppleState | null {
  const state = useSyncExternalStore(subscribeApple, readApple, serverSnapshot);

  // "used" turns into "tree" on a clock, not an event: wake everyone when
  // the regrow is due.
  useEffect(() => {
    if (state !== "used") return;
    const t = window.setTimeout(() => window.dispatchEvent(new Event("apple-change")), regrowIn() + 50);
    return () => window.clearTimeout(t);
  }, [state]);

  return state;
}
