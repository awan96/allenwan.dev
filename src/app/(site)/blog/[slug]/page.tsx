// src/app/(site)/blog/[slug]/page.tsx
// One post: its header, then the MDX body set for long-form reading.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteSprite from "@/components/pixel/SiteSprite";
import { DetailHeader, QuietLink } from "@/components/site/ui";
import { getAllPosts, getPost, formatDate, isShown } from "@/lib/blog";
import { pageMeta } from "@/site";
import Mdx from "./mdx";
import styles from "./post.module.css";

// Next 16 hands dynamic params over as a Promise.
type Props = { params: Promise<{ slug: string }> };

// A placeholder isn't shown in production (isShown in lib/blog.ts), so it
// isn't built there and its URL answers 404.
export function generateStaticParams() {
  return getAllPosts().filter(isShown).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  // Next 16 renders a page-level notFound() from this payload on the
  // client, so a missing post names itself here or the tab says the default.
  if (!post || !isShown(post)) return { title: "Page not found" };
  const meta = pageMeta({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    type: "article",
    published: post.date || undefined,
  });
  // A placeholder post stays out of search, as a filler project does.
  return post.filler ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || !isShown(post)) notFound();

  return (
    <main id="main" className="wrap">
      <article>
        <DetailHeader
          back={{ href: "/blog", label: "All posts" }}
          meta={
            <>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.minutes} min read</span>
            </>
          }
          title={post.title}
          lede={post.description || undefined}
          stamps={post.tags}
        />

        <div className={styles.prose}>
          <Mdx source={post.content} />
        </div>

        {/* The end mark: the site's tree, set in the closing rule. (The
            apple is the one on the home page's tree, never a decoration.) */}
        <footer className={styles.end}>
          <div className={styles.endMark} aria-hidden="true">
            <SiteSprite name="mark" scale={3} />
          </div>
          <QuietLink href="/blog"><span aria-hidden="true">← </span>All posts</QuietLink>
        </footer>
      </article>
    </main>
  );
}
