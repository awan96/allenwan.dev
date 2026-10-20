// src/app/not-found.tsx
// The 404 for a URL that matches no route. It sits outside the (site)
// group, so it brings its own Nav and Footer around the site's 404 body
// ((site)/not-found.tsx, which notFound() inside a site page renders).

import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/site/Footer";
import SiteNotFound from "./(site)/not-found";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className={styles.page}>
      <Nav />
      <SiteNotFound />
      <Footer />
    </div>
  );
}
