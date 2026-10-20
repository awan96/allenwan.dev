// src/app/(site)/blog/page.tsx
// The writing index: one ruled row per post, newest first.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Stamps } from "@/components/site/ui";
import { getAllPosts, formatDate, hasRealPosts, isShown } from "@/lib/blog";
import { pageMeta } from "@/site";
import styles from "./blog.module.css";

// In production the blog answers 404 until its first real post (D5,
// docs/SITE.md); dev keeps it, out of search, so a post can be written.
const OPEN = process.env.NODE_ENV !== "production" || hasRealPosts();

export const metadata: Metadata = OPEN
  ? {
      ...pageMeta({
        title: "Blog",
        description: "Writing about code, projects, and whatever I'm building.",
        path: "/blog",
      }),
      ...(hasRealPosts() ? {} : { robots: { index: false, follow: true } }),
    }
  : { title: "Page not found" };

export default function Blog() {
  if (!OPEN) notFound();
  const posts = getAllPosts().filter(isShown);

  return (
    <main id="main" className="wrap">
      <PageHeader
        eyebrow="Writing"
        title="Blog"
        lede="Notes on code, projects, and whatever I'm building."
      />

      {posts.length === 0 ? (
        <p className={styles.empty}>No posts yet.</p>
      ) : (
        <ol className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug} className={styles.item}>
              <div className={styles.meta}>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className={styles.minutes}>{post.minutes} min read</span>
              </div>
              <div className={styles.body}>
                <h2 className={styles.title}>
                  {/* The title's link stretches over the whole row. */}
                  <Link href={`/blog/${post.slug}`} className={styles.link}>
                    {post.title}
                  </Link>
                </h2>
                {post.description && <p className={styles.desc}>{post.description}</p>}
                <div className={styles.tags}>
                  <Stamps items={post.tags} />
                </div>
              </div>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
