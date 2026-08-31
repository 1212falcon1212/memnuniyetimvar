import Link from "next/link";
import Image from "next/image";
import { SponsoredBadge } from "@/components/common/Badges";

interface CompanyCardProps {
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  memnuniyetScore: number;
  categoryName: string | null;
  isSponsored?: boolean;
}

export function CompanyCard({
  name,
  slug,
  logoUrl,
  city,
  isVerified,
  avgRating,
  reviewCount,
  memnuniyetScore,
  isSponsored,
}: CompanyCardProps) {
  const displayName = name || "Firma";
  const scorePercent = Math.min(memnuniyetScore, 100);

  return (
    <Link
      href={`/firma/${slug}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        {logoUrl ? (
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-emerald-50">
            <Image
              src={logoUrl}
              alt={displayName}
              fill
              className="object-contain p-1"
              sizes="56px"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 truncate">{displayName}</h3>
            {isVerified && (
              <span className="flex-shrink-0 text-primary" title="Doğrulanmış Firma">
                ✅
              </span>
            )}
            {isSponsored && <SponsoredBadge />}
          </div>

          {city && <p className="text-sm text-gray-500 mt-0.5">📍 {city}</p>}

          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="font-semibold text-accent">★ {avgRating.toFixed(1)}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{reviewCount.toLocaleString("tr-TR")} değerlendirme</span>
          </div>

          {/* MemnuniyetEndeks */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">MemnuniyetEndeks</span>
              <span className="font-semibold text-primary">{Math.round(memnuniyetScore)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
