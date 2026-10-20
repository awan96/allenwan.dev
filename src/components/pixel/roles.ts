// Shared pixel-sprite format, used by every sprite library on the site
// (game icons, game art, site sprites) and by the sprite editor.
//
// A sprite is a rectangular grid of characters:
//   "." transparent   "o" outline   A–H palette roles
// Each library maps role letters to its own named palette through a Roles
// record, so recoloring stays a one-line change in one file.

export const ROLE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export type RoleLetter = (typeof ROLE_LETTERS)[number];

export type RoleMap<Color extends string = string> = Partial<Record<RoleLetter, Color>>;

export function isRoleLetter(ch: string): ch is RoleLetter {
  return (ROLE_LETTERS as readonly string[]).includes(ch);
}

/**
 * Resolve one grid character to a fill color, or null for transparent.
 * `mutedPalette` (optional) substitutes colors role-by-role — the map uses it
 * to keep terrain dark so points of interest are the only bright pixels.
 */
export function colorForChar(
  ch: string | undefined,
  roles: RoleMap,
  palette: Record<string, string>,
  mutedPalette?: Partial<Record<string, string>>
): string | null {
  if (!ch || ch === "." || ch === " ") return null;
  if (ch === "o") return palette.outline ?? null;
  if (!isRoleLetter(ch)) return null;
  const role = roles[ch];
  if (!role) return null;
  if (mutedPalette?.[role]) return mutedPalette[role]!;
  return palette[role] ?? null;
}
