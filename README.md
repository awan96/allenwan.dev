# allenwan.dev

The source of my personal site, live at https://allenwan.dev: who I am, what
I've built, and the pixel-art tooling behind it. Next.js (app router),
TypeScript and CSS Modules; no CMS, the content is files.

This repository is an export. I develop the site in a private repository that
also holds To Arms, Squire!, the browser RPG you can play at
[allenwan.dev/game](https://allenwan.dev/game), and copy the site's half out
here as a snapshot now and then, so the commits are exports, not the work.
The game itself is not public. The pages that show it (the stage on the home
page, the case study) draw its fighters from a generated copy,
`src/components/project/stageFighters.ts`, so this copy builds and runs
without it; here `/game` is only a link.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Where things live

| What | Where |
| --- | --- |
| Name, bio, email, socials, nav | `src/site.ts` (one place; metadata, footer, contact, sitemap read it) |
| Case studies | `content/projects/*.mdx` (frontmatter feeds the cards, body is the page, `cover` sets the header's art) |
| Blog posts | `content/blog/*.mdx` |
| Site pages | `src/app/(site)/` (shares the nav + footer) |
| Design tokens, grain, stamps | `src/styles/globals.css`, primitives in `src/components/site/ui.tsx` |
| Pixel art | `src/components/pixel/siteSprites.ts`, a library of character grids |
| Sprite editor | `/sprite-editor` in dev (saves straight into the library; 404s in production) |
| The hero's skies and figures | `src/components/site/scene/`, drawn by `scripts/hero-day-svg.mjs` and `hero-dither-svg.mjs` |

A post is a new `.mdx` file with this frontmatter:

```md
---
title: "My next post"
description: "One line for the list page."
date: "2026-07-12"
tags: ["thoughts"]
---
```

## The pixel art and its editor

Every sprite on the site is a grid of characters in a TypeScript file: `.`
is transparent, `o` the outline, and the letters A–H are roles that each
sprite maps to a named colour of its library's palette, so recolouring is a
one-line change. `src/components/pixel/SpriteSvg.tsx` renders a grid as inline
SVG, one path per colour.

The editor at `/sprite-editor` (dev only) paints those grids and saves them
back into the library file through `src/app/api/dev/sprites/route.ts`, which
splices the entry into the `GRIDS` and `ICON_ROLES` blocks by line and keeps
them alphabetised; the dev server's file watcher reloads the sprite into the
running site a moment later. In the private repository the same editor serves
the game's four libraries too: its icons, art, fighters and tarot.

## License

The code is under the MIT license (see `LICENSE`). The writing under
`content/`, the images under `public/`, and the pixel art itself (the sprite
grids and the generated fighters) are © Allen Wan, all rights reserved.
