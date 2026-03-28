import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://memnuniyetimvar.com";

export async function GET() {
  const staticPages = [
    "",
    "/firma",
    "/kategori",
    "/en-iyi-firmalar",
    "/trend",
    "/giris",
    "/kayit",
    "/hakkimizda",
    "/kvkk",
    "/iletisim",
  ];

  // TODO: API'den dinamik sayfaları çek (firma slug'ları, yorum slug'ları, kategori slug'ları)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page}</loc>
    <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
