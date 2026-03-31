"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { CompanyCard } from "@/components/company/CompanyCard";
import { ReviewCard } from "@/components/review/ReviewCard";

interface SearchResults {
  companies: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  totalCompanies: number;
  totalReviews: number;
}

export default function AramaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api
      .get("/search", { params: { q: query, limit: 10 } })
      .then((res) => setResults(res.data.data || res.data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Arama Sonuçları</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        {query ? `"${query}" için sonuçlar` : "Arama Sonuçları"}
      </h1>

      {loading && (
        <div className="mt-8 text-center text-gray-400">Aranıyor...</div>
      )}

      {!loading && !query && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
          Aramak istediğiniz kelimeyi girin
        </div>
      )}

      {!loading && results && (
        <>
          {results.companies.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Firmalar ({results.totalCompanies})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.companies.map((company) => (
                  <CompanyCard
                    key={company.id as string}
                    name={company.name as string}
                    slug={company.slug as string}
                    logoUrl={null}
                    city={(company.city as string) || null}
                    isVerified={false}
                    avgRating={Number(company.avgRating || 0)}
                    reviewCount={Number(company.reviewCount || 0)}
                    memnuniyetScore={Number(company.memnuniyetScore || 0)}
                    categoryName={(company.categoryName as string) || null}
                  />
                ))}
              </div>
            </section>
          )}

          {results.reviews.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Yorumlar ({results.totalReviews})
              </h2>
              <div className="space-y-4">
                {results.reviews.map((review) => (
                  <ReviewCard
                    key={review.id as string}
                    title={review.title as string}
                    content={review.content as string}
                    rating={review.rating as number}
                    slug={review.slug as string}
                    userName={(review.userName as string) || "Anonim"}
                    userAvatarUrl={null}
                    companyName={(review.companyName as string) || ""}
                    companySlug={(review.companySlug as string) || ""}
                    helpfulCount={0}
                    hasResponse={false}
                    createdAt=""
                  />
                ))}
              </div>
            </section>
          )}

          {results.companies.length === 0 && results.reviews.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
              &quot;{query}&quot; için sonuç bulunamadı
            </div>
          )}
        </>
      )}
    </div>
  );
}
