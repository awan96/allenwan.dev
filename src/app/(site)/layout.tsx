// src/app/(site)/layout.tsx
// Every portfolio page shares the nav and the footer. The game and the dev
// editors live outside this group and render their own Nav.

import Nav from "@/components/Nav";
import Footer from "@/components/site/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
