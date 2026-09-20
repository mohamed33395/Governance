import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

// Loaded the same way as the original site (Google Fonts CDN links) so the
// literal `font-family: 'Amiri'` / `'IBM Plex Sans Arabic'` declarations
// ported verbatim from the legacy CSS resolve exactly as before.

export const metadata: Metadata = {
  title: "مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية",
  description: "مكتب متخصص في استشارات الحوكمة والامتثال والاستشارات الإدارية",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html dir="rtl" lang="ar" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
