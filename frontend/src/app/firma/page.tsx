import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Firmalar",
  description: "MemnuniyetimVar'da kayıtlı tüm firmaları keşfedin.",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function getCompanies() {
  try {
    const res = await fetch(`${API}/companies?limit=20`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export default async function FirmaListPage() {
  const companies = await getCompanies();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-foreground">Firmalar</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">
        Tüm Firmalar
      </h1>
      <p className="mt-2 text-muted">{companies.length} firma listeleniyor</p>

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
                {c.isVerified && <span className="text-primary text-xs">✓ Doğrulanmış</span>}
              </div>
              {c.city && <p className="text-sm text-muted mt-0.5">{c.city}{c.district ? `, ${c.district}` : ''}</p>}
              {c.description && <p className="text-sm text-muted mt-1 line-clamp-1">{c.description}</p>}
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="font-semibold text-accent">★ {Number(c.avgRating).toFixed(1)}</span>
                <span className="text-muted">{c.reviewCount} değerlendirme</span>
                <span className="text-muted">MemnuniyetEndeks: {Math.round(Number(c.memnuniyetScore))}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted">
          Henüz firma bulunmuyor.
        </div>
      )}
    </div>
  );
}
