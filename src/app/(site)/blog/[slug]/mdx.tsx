// src/app/(site)/blog/[slug]/mdx.tsx
// Renders a post's MDX body, through elements that behave like the rest of
// the site: links that open the way the site's links do, and code blocks
// that name their language.

import Link from "next/link";
import { isValidElement, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from "react";
import * as devRuntime from "react/jsx-dev-runtime";
import * as prodRuntime from "react/jsx-runtime";
import { serialize } from "next-mdx-remote/serialize";
import styles from "./post.module.css";

function A({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/")) return <Link href={href} {...rest}>{children}</Link>;
  if (href.startsWith("http")) {
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
  }
  return <a href={href} {...rest}>{children}</a>;
}

// A fenced block arrives as <pre><code className="language-md">: lift the
// language out into a small tab on the block's corner.
function Pre({ children, ...rest }: ComponentPropsWithoutRef<"pre">) {
  const code = isValidElement(children) ? (children as ReactElement<{ className?: string }>) : null;
  const lang = code?.props.className?.match(/language-(\S+)/)?.[1];
  return (
    <div className={`${styles.codeBlock} ${lang ? styles.tabbed : ""}`}>
      {lang && <span className={styles.codeLang} aria-hidden="true">{lang}</span>}
      {/* Focusable so a keyboard can scroll a wide block sideways; named so
          the stop says what it is. */}
      <pre {...rest} tabIndex={0} role="region" aria-label={lang ? `${lang} code` : "Code"}>
        {children}
      </pre>
    </div>
  );
}

const components = { a: A, pre: Pre };

type MdxContent = (props: { components: typeof components }) => ReactNode;

// next-mdx-remote/rsc builds its elements with the React in node_modules
// (18), which the React that Next 16 bundles refuses to render. So compile
// with its serializer, which keeps its guards that strip JS out of the MDX,
// and run the result against the React this app actually renders with.
export default async function Mdx({ source }: { source: string }) {
  const { compiledSource } = await serialize(source, {}, true);
  const runtime = process.env.NODE_ENV === "production" ? prodRuntime : devRuntime;
  const { default: Content } = new Function(compiledSource)(runtime) as { default: MdxContent };
  return <Content components={components} />;
}
