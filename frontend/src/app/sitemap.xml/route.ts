import { NextResponse } from "next/server";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://memnuniyetimvar.com").replace(/\/$/, "");
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface SitemapItem {
  loc: string;
  lastmod?: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
}

interface SlugItem {
  slug: string;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
}

interface CategorySitemapItem extends SlugItem {
  children?: CategorySitemapItem[];
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function fetchList<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${endpoint}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const payload = json.data || json;
    return Array.isArray(payload) ? payload : payload.data || [];
  } catch {
    return [];
  }
}

function flattenCategories(categories: CategorySitemapItem[]): SlugItem[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children || [])]);
}

export async function GET() {
  const staticPages: SitemapItem[] = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/firma", changefreq: "daily", priority: "0.9" },
    { loc: "/kategori", changefreq: "weekly", priority: "0.8" },
    { loc: "/en-iyi-firmalar", changefreq: "daily", priority: "0.8" },
    { loc: "/trend", changefreq: "daily", priority: "0.8" },
  ];

  const [companies, categoriesTree, reviews, pages] = await Promise.all([
    fetchList<SlugItem>("/companies?limit=100"),
    fetchList<CategorySitemapItem>("/categories"),
    fetchList<SlugItem>("/reviews/latest?limit=500"),
    fetchList<SlugItem>("/pages"),
  ]);

  const categories = flattenCategories(categoriesTree);
  const dynamicPages: SitemapItem[] = [
    ...companies.map((item) => ({ loc: `/firma/${item.slug}`, lastmod: item.updatedAt || item.updated_at || item.createdAt || item.created_at, changefreq: "weekly" as const, priority: "0.8" })),
    ...categories.map((item) => ({ loc: `/kategori/${item.slug}`, lastmod: item.updatedAt || item.updated_at || item.createdAt || item.created_at, changefreq: "weekly" as const, priority: "0.7" })),
    ...reviews.map((item) => ({ loc: `/memnuniyet/${item.slug}`, lastmod: item.updatedAt || item.updated_at || item.createdAt || item.created_at, changefreq: "monthly" as const, priority: "0.6" })),
    ...pages.map((item) => ({ loc: `/${item.slug}`, lastmod: item.updatedAt || item.updated_at || item.createdAt || item.created_at, changefreq: "monthly" as const, priority: "0.5" })),
  ];

  const urls = [...staticPages, ...dynamicPages].filter((item, index, arr) => arr.findIndex((x) => x.loc === item.loc) === index);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>
    <loc>${escapeXml(`${BASE_URL}${item.loc}`)}</loc>${item.lastmod ? `
    <lastmod>${new Date(item.lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
