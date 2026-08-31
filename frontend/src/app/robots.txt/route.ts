import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://memnuniyetimvar.com";
const isProduction = process.env.NODE_ENV === "production";

export async function GET() {
  const robotsTxt = isProduction ? `User-agent: *
Allow: /
Disallow: /api/
Disallow: /profil/
Disallow: /memnuniyet/yaz
Disallow: /giris
Disallow: /kayit
Disallow: /sifre-sifirla

Sitemap: ${BASE_URL}/sitemap.xml
Host: ${BASE_URL.replace(/^https?:\/\//, "")}
` : `User-agent: *
Disallow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
