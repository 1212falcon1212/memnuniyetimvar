import type { Metadata } from "next";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API}/categories/${slug}`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || null;
  } catch { return null; }
}

async function getCompanies(slug: string) {
  try {
    const res = await fetch(`${API}/companies/by-category/${slug}?limit=20`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return {
    title: category?.name || slug,
    description: `${category?.name || slug} kategorisindeki en iyi firmaları keşfedin.`,
  };
}

export default async function KategoriDetailPage({ params }: Props) {
  const { slug } = await params;
  const [category, companies] = await Promise.all([getCategory(slug), getCompanies(slug)]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/kategori" className="hover:text-primary">Kategoriler</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-foreground">{category?.name || slug}</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">
        {category?.name || slug.replace(/-/g, " ")}
      </h1>
      {category?.description && <p className="mt-2 text-muted">{category.description}</p>}
      <p className="mt-1 text-sm text-muted">{companies.length} firma listeleniyor</p>

      {/* Alt kategoriler */}
      {category?.children?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category.children.map((child: any) => (
            <Link
              key={child.slug}
              href={`/kategori/${child.slug}`}
              className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((c: any) => (
          <Link
            key={c.id}
            href={`/firma/${c.slug}`}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-xl font-bold text-primary">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground truncate">{c.name}</h3>
                {c.isVerified && <span className="text-primary text-xs">✓</span>}
              </div>
              {c.city && <p className="text-sm text-muted mt-0.5">{c.city}</p>}
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="font-semibold text-accent">★ {Number(c.avgRating).toFixed(1)}</span>
                <span className="text-muted">{c.reviewCount} yorum</span>
                <span className="text-muted">Endeks: {Math.round(Number(c.memnuniyetScore))}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted">
          Bu kategoride henüz firma bulunmuyor.
        </div>
      )}
    </div>
  );
}
