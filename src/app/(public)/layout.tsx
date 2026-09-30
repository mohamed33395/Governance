import type { ReactNode } from "react";
import "@/styles/public-site.css";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { PublicSkipLink } from "@/components/public/PublicSkipLink";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div id="site-view">
      <PublicSkipLink />
      <Header />
      <div id="main" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <Footer />
    </div>
  );
}
