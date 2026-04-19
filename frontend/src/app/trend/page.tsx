import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trend Firmalar",
  description: "Son 7 günde en çok memnuniyet yorumu alan firmalar.",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function getTrending() {
  try {
    const res = await fetch(`${API}/companies/trending?limit=20`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export default async function TrendPage() {
  const companies = await getTrending();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-foreground">Trend Firmalar</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">
        Trend Firmalar
      </h1>
      <p className="mt-2 text-muted">En çok yorum alan firmalar</p>

      <div className="mt-8 space-y-3">
        {companies.map((c: any, i: number) => (
          <Link
            key={c.id}
            href={`/firma/${c.slug}`}
            className="flex items-center gap-5 rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-xl font-bold text-muted w-8 text-center">{i + 1}.</span>
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-lg font-bold text-primary">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{c.name}</span>
                {c.isVerified && <span className="text-primary text-xs">✓</span>}
              </div>
              <span className="text-sm text-muted">{c.category?.name || ''} · {c.city}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-accent">★ {Number(c.avgRating).toFixed(1)}</span>
              <p className="text-xs text-muted">{c.reviewCount} yorum</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
