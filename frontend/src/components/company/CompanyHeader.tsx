import Link from "next/link";

interface CompanyHeaderProps {
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  website: string | null;
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  responseRate: number;
  memnuniyetScore: number;
  categoryName: string | null;
  categorySlug: string | null;
}

export function CompanyHeader({
  name,
  city,
  website,
  isVerified,
  avgRating,
  reviewCount,
  responseRate,
  memnuniyetScore,
  categoryName,
  categorySlug,
}: CompanyHeaderProps) {
  const scorePercent = Math.min(memnuniyetScore, 100);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
          {categoryName && categorySlug && (
            <>
              <span className="mx-2">&gt;</span>
              <Link href={`/kategori/${categorySlug}`} className="hover:text-primary">{categoryName}</Link>
            </>
          )}
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900">{name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Logo */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-3xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-gray-900">
                {name}
              </h1>
              {isVerified && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-primary">
                  ✅ Doğrulanmış
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="font-semibold text-accent text-lg">★ {avgRating.toFixed(1)} / 5</span>
              <span className="text-gray-400">·</span>
              <span>{reviewCount.toLocaleString("tr-TR")} değerlendirme</span>
              {city && (
                <>
                  <span className="text-gray-400">·</span>
                  <span>📍 {city}</span>
                </>
              )}
              {website && (
                <>
                  <span className="text-gray-400">·</span>
                  <span>🌐 {website}</span>
                </>
              )}
            </div>

            {/* MemnuniyetEndeks bar */}
            <div className="mt-4 max-w-sm rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">MemnuniyetEndeks</span>
                <span className="text-lg font-bold text-primary">{Math.round(memnuniyetScore)}/100</span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full bg-primary transition-all"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Yanıt Oranı: %{Math.round(responseRate)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href={`/memnuniyet/yaz`}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Memnuniyetini Paylaş
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
