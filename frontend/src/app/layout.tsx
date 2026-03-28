import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
