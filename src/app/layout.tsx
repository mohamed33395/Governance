import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

// Loaded the same way as the original site (Google Fonts CDN links) so the
// literal `font-family: 'Amiri'` / `'IBM Plex Sans Arabic'` declarations
// ported verbatim from the legacy CSS resolve exactly as before.

const TITLE = "مكتب المتخصصون في الحوكمة والامتثال للاستشارات الإدارية";
const DESCRIPTION = "مكتب متخصص في استشارات الحوكمة والامتثال والاستشارات الإدارية";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: "/favicon.png", apple: "/logo_icon.png" },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/loge_leger-.png", alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/loge_leger-.png"] },
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
