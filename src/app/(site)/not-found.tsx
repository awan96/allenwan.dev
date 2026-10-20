// src/app/(site)/not-found.tsx
// The site's 404: the orchard tree, bare, and one way home. This one answers
// notFound() from any site page (a missing post or project) inside the site
// layout, which already draws the Nav and the Footer. app/not-found.tsx
// wraps this same body for URLs that match no route at all.

import type { Metadata } from "next";
import NotFoundScene from "@/components/site/NotFoundScene";
import { ButtonLink } from "@/components/site/ui";
import styles from "../not-found.module.css";

export const metadata: Metadata = { title: "Page not found" };

export default function SiteNotFound() {
  return (
    <main id="main" className={`wrap ${styles.main}`}>
      <NotFoundScene />

      <p className={`eyebrow ${styles.code}`}>404</p>
      <h1 className={styles.title}>This page wandered off</h1>
      <p className={styles.sub}>The link may be old, or the page has moved.</p>
      <ButtonLink href="/">Back home</ButtonLink>
    </main>
  );
}
