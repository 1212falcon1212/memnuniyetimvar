import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://memnuniyetimvar.com";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MemnuniyetimVar — Teşekkür için bir neden var!",
    template: "%s | MemnuniyetimVar",
  },
  description:
    "Türkiye'nin pozitif müşteri deneyimi platformu. Memnuniyetinizi paylaşın, firmaları teşekkürle ödüllendirin.",
  keywords: [
    "memnuniyet",
    "müşteri deneyimi",
    "teşekkür",
    "firma değerlendirme",
    "pozitif yorum",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "MemnuniyetimVar",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "MemnuniyetimVar — Teşekkür için bir neden var!",
    description: "Türkiye'nin pozitif müşteri deneyimi platformu.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-[family-name:var(--font-body)]">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
