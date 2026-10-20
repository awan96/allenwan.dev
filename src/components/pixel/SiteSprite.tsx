import type { CSSProperties } from "react";
import SpriteSvg from "./SpriteSvg";
import { GRIDS, ICON_ROLES, PALETTE } from "./siteSprites";

type Props = {
  name: string;
  /** px per grid pixel; omit to size via CSS (className). */
  scale?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

/** Renders a sprite from the site pixel library (siteSprites.ts). */
export default function SiteSprite({ name, scale, className, style, title }: Props) {
  const grid = GRIDS[name];
  if (!grid) return null;
  return (
    <SpriteSvg
      grid={grid}
      roles={ICON_ROLES[name] ?? {}}
      palette={PALETTE}
      scale={scale}
      className={className}
      style={style}
      title={title}
    />
  );
}
