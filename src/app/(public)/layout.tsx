import type { ReactNode } from "react";
import "@/styles/public-site.css";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div id="site-view">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
