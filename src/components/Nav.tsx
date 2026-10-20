// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE } from "@/site";
import styles from "./Nav.module.css";

export default function Nav() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skip}>Skip to content</a>
      <nav className={styles.nav} aria-label="Main">
        <Link href="/" className={styles.logo} aria-label={`${SITE.name}, home`}>
          <span className={styles.logoText}>{SITE.name}</span>
        </Link>
        <div className={styles.right}>
          <ul className={styles.links}>
            {NAV_LINKS.map(({ href, label, prefetch }) => (
              <li key={href}>
                <Link
                  href={href}
                  prefetch={prefetch}
                  className={`${styles.link} ${isActive(href) ? styles.active : ""}`}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
