import type { CSSProperties } from "react";
import { colorForChar, type RoleMap } from "./roles";
import { cachedSprite } from "./spritePaths";

type Props = {
  grid: string[];
  roles: RoleMap;
  palette: Record<string, string>;
  /** Substitute colors role-by-role (the game map's muted terrain mode). */
  mutedPalette?: Partial<Record<string, string>>;
  /** Explicit rendered size in px… */
  width?: number;
  height?: number;
  /** …or px per grid pixel. Omit all three to size via CSS (className). */
  scale?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

/**
 * Renders any grid sprite as inline SVG — the shared renderer behind
 * PixelIcon (game icons), FighterSprite (the fighters), the tarot art,
 * ArtSprite (the old game art) and SiteSprite (site art).
 * Grids can be any rectangular size. Each colour is one path, the fewest
 * rectangles its pixels pack into (spritePaths.ts), so a sprite costs a
 * page a handful of elements, not one per run of pixels.
 */
export default function SpriteSvg({
  grid, roles, palette, mutedPalette, width, height, scale, className, style, title,
}: Props) {
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  const paths = cachedSprite(grid, [roles, palette, mutedPalette], (ch) => colorForChar(ch, roles, palette, mutedPalette));
  return (
    <svg
      viewBox={`0 0 ${colCount} ${rowCount}`}
      width={width ?? (scale ? colCount * scale : undefined)}
      height={height ?? (scale ? rowCount * scale : undefined)}
      shapeRendering="crispEdges"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      style={style}
    >
      {title && <title>{title}</title>}
      {paths.map((p) => (
        <path key={p.fill} d={p.d} fill={p.fill} />
      ))}
    </svg>
  );
}
