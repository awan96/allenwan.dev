// The site's own sprite library, registered for the sprite editor: the tree
// and its apple, the squire at rest, the card icons, the interest badges.
// Client-safe: only imports sprite data modules.

import * as siteSprites from "./siteSprites";
import type { SpriteTarget } from "./spriteTarget";

export const SITE_TARGETS: SpriteTarget[] = [
  {
    id: "site",
    label: "Site sprites — tree & friends",
    file: "src/components/pixel/siteSprites.ts",
    grids: siteSprites.GRIDS,
    roles: siteSprites.ICON_ROLES,
    palette: siteSprites.PALETTE,
    defaultSize: { width: 22, height: 34 },
    defaultRoles: { A: "leaf", B: "leafLight" },
  },
];
