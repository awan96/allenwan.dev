// src/components/project/mdx.tsx
// Everything a case study's MDX can use, handed to MDXRemote as one map.
// Props are plain strings (and bare boolean attributes like `wide`): the
// loader strips {expressions}, which keeps content files simple to edit.

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "./Callout";
import { Figure, Gallery } from "./Figure";
import { GridAnatomy } from "./GridAnatomy";
import { Sprite, SpriteShowcase } from "./SpriteShowcase";
import { Stamp } from "./Stamp";
import { Stat, Stats } from "./Stats";

/** Site links route client-side; outside links open in a new tab. */
function MdxLink({ href = "", ...rest }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/")) return <Link href={href} {...rest} />;
  if (/^https?:/.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
  return <a href={href} {...rest} />;
}

export const mdxComponents = {
  a: MdxLink,
  Callout,
  Figure,
  Gallery,
  GridAnatomy,
  Sprite,
  SpriteShowcase,
  Stamp,
  Stat,
  Stats,
};
