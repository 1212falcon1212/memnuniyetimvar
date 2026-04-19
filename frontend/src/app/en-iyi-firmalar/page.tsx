import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "En İyi Firmalar",
  description: "MemnuniyetimVar'da en çok teşekkür edilen firmalar.",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function getTopCompanies() {
  try {
    const res = await fetch(`${API}/companies/top?limit=20`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export default async function EnIyiFirmalarPage() {
  const companies = await getTopCompanies();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-foreground">En İyi Firmalar</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">
        En Çok Teşekkür Edilen Firmalar
      </h1>
      <p className="mt-2 text-muted">MemnuniyetEndeks puanına göre sıralama</p>

      <div className="mt-8 space-y-3">
        {companies.map((c: any, i: number) => {
          const score = Math.round(Number(c.memnuniyetScore) || 0);
          return (
            <Link
              key={c.id}
              href={`/firma/${c.slug}`}
              className="flex items-center gap-5 rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
              <span className="text-xl font-bold text-muted w-8 text-center">{i + 1}.</span>
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-xl font-bold text-primary">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{c.name}</span>
                  {c.isVerified && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">✓ PRO</span>}
                </div>
                <span className="text-sm text-muted">{c.reviewCount} değerlendirme · {c.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-accent">⭐</span>
                <span className="text-xl font-bold text-foreground">{score}</span>
                <span className="text-sm text-muted">/100</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
