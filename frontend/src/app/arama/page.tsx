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
  categories: Record<string, unknown>[];
  totalCompanies: number;
  totalReviews: number;
  totalCategories: number;
}

export default function AramaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(false);

    api
      .get("/search", { params: { q: query, limit: 20 } })
      .then((res) => {
        const data = res.data.data || res.data;
        setResults({
          companies: Array.isArray(data.companies) ? data.companies : [],
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          totalCompanies: data.totalCompanies ?? 0,
          totalReviews: data.totalReviews ?? 0,
          totalCategories: data.totalCategories ?? 0,
        });
      })
      .catch(() => {
        setError(true);
        setResults({
          companies: [],
          reviews: [],
          categories: [],
          totalCompanies: 0,
          totalReviews: 0,
          totalCategories: 0,
        });
      })
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
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Aranıyor...
        </div>
      )}

      {!loading && !query && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
          Aramak istediğiniz kelimeyi girin
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600 font-medium">Arama sırasında bir hata oluştu</p>
          <p className="text-red-400 text-sm mt-1">Lütfen daha sonra tekrar deneyin</p>
        </div>
      )}

      {!loading && results && !error && (
        <>
          {results.categories.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Kategoriler ({results.totalCategories})
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((cat) => (
                  <Link
                    key={cat.id as string}
                    href={`/kategori/${cat.slug as string}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#166534] hover:text-[#166534]"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    {cat.name as string}
                  </Link>
                ))}
              </div>
            </section>
          )}

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

          {results.companies.length === 0 && results.reviews.length === 0 && results.categories.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
              &quot;{query}&quot; için sonuç bulunamadı
            </div>
          )}
        </>
      )}
    </div>
  );
}
