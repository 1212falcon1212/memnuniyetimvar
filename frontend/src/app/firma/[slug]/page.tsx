import type { Metadata } from "next";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCompany(slug: string) {
  try {
    const res = await fetch(`${API}/companies/${slug}`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || null;
  } catch { return null; }
}

async function getReviews(slug: string) {
  try {
    const res = await fetch(`${API}/companies/${slug}/reviews?limit=10`, { next: { revalidate: 60 } });
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  return {
    title: company?.name || slug,
    description: company?.description || `${slug} firması hakkında memnuniyet yorumları.`,
  };
}

export default async function FirmaDetailPage({ params }: Props) {
  const { slug } = await params;
  const [company, reviews] = await Promise.all([getCompany(slug), getReviews(slug)]);

  if (!company) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Firma bulunamadı</h1>
        <Link href="/firma" className="mt-4 inline-block text-primary hover:underline">Firmalara dön</Link>
      </div>
    );
  }

  const scorePercent = Math.min(Number(company.memnuniyetScore) || 0, 100);

  return (
    <div>
      {/* Company Header */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-muted mb-4">
            <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
            <span className="mx-2">&gt;</span>
            <Link href="/firma" className="hover:text-primary">Firmalar</Link>
            <span className="mx-2">&gt;</span>
            <span className="text-foreground">{company.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-3xl font-bold text-primary">
              {company.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-foreground">
                  {company.name}
                </h1>
                {company.isVerified && (
                  <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">✓ Doğrulanmış</span>
                )}
              </div>
              {company.description && <p className="mt-2 text-muted">{company.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="font-semibold text-accent text-lg">★ {Number(company.avgRating).toFixed(1)} / 5</span>
                <span>{company.reviewCount} değerlendirme</span>
                {company.city && <span>{company.city}{company.district ? `, ${company.district}` : ''}</span>}
                {company.website && <span>{company.website}</span>}
              </div>

              {/* MemnuniyetEndeks */}
              <div className="mt-4 max-w-sm rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">MemnuniyetEndeks</span>
                  <span className="text-lg font-bold text-primary">{Math.round(scorePercent)}/100</span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100">
                  <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: `${scorePercent}%` }} />
                </div>
                <div className="mt-2 text-xs text-muted">Yanıt Oranı: %{Math.round(Number(company.responseRate) || 0)}</div>
              </div>

              <div className="mt-4">
                <Link href="/memnuniyet/yaz" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
                  Memnuniyetini Paylaş
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-foreground">
          Memnuniyet Yorumları ({company.reviewCount})
        </h2>

        <div className="mt-6 space-y-4">
          {reviews.length > 0 ? reviews.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-accent text-lg">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <Link href={`/memnuniyet/${r.slug}`} className="mt-1 block text-base font-semibold text-foreground hover:text-primary">
                    {r.title}
                  </Link>
                </div>
                <span className="text-xs text-muted">{r.viewCount?.toLocaleString('tr-TR')} görüntülenme</span>
              </div>
              <p className="mt-2 text-sm text-muted line-clamp-2">{r.content}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span className="font-medium text-foreground">{r.user?.full_name || 'Kullanıcı'}</span>
                <span>·</span>
                <span>👍 {r.helpfulCount || 0} kişi faydalı buldu</span>
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted">
              Henüz yorum yazılmamış. İlk yorumu siz yazın!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
