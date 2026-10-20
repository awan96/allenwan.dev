// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Karla, Sometype_Mono, Vollkorn } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/site";
import { SKY_SCRIPT } from "@/lib/sky";
import "@/styles/globals.css";

// "Storybook", picked by Allen in /font-picker on 2026-10-13: Vollkorn
// headlines, Karla body text, Sometype Mono labels. Headlines use the one
// weight (--weight-display in globals.css), so only it is loaded; Karla and
// Sometype Mono are variable fonts, every weight in one file. The game sets
// its own face (components/game/gameFont.ts).
const serif = Vollkorn({
  subsets: ["latin"],
  weight: "600",
  style: ["normal", "italic"],
  variable: "--font-vollkorn",
  display: "swap",
});
const sans = Karla({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-karla",
  display: "swap",
});
const mono = Sometype_Mono({
  subsets: ["latin"],
  variable: "--font-sometype",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.role}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} · ${SITE.role}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
  // The large card, drawn by app/opengraph-image.tsx (lib/shareImage.tsx).
  // Pages restate all of this through pageMeta.
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} · ${SITE.role}`,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efdd" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-sky is stamped by SKY_SCRIPT before paint, so React must not
    // complain that the server didn't render it. data-scroll-behavior tells
    // Next the page scrolls smoothly (globals.css), so it turns that off
    // while it moves to the top of a new page.
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* A raw inline script, not next/script: beforeInteractive defers an
            inline script until Next's runtime boots, after first paint, and
            a night visitor would see the day sky flash. In dev, React warns
            when a notFound() re-renders this layout on the client; that
            render doesn't need the script (data-sky is already set). */}
        <script dangerouslySetInnerHTML={{ __html: SKY_SCRIPT }} />
      </head>
      <body>
        {children}
        {/* Vercel Web Analytics: cookieless page views, counted only on a
            Vercel deployment with Analytics enabled for the project. */}
        <Analytics />
      </body>
    </html>
  );
}
