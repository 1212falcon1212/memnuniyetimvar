import type { Metadata } from "next";
import Link from "next/link";
import { CompanyCard } from "@/components/company/CompanyCard";
import { CompanyFilters } from "./CompanyFilters";

export const metadata: Metadata = {
  title: "Firmalar",
  description: "MemnuniyetimVar'da kayıtlı tüm firmaları keşfedin, değerlendirmeleri okuyun.",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function getCompanies(searchParams: Record<string, string>) {
  const params = new URLSearchParams();
  if (searchParams.city) params.set("city", searchParams.city);
  if (searchParams.categoryId) params.set("categoryId", searchParams.categoryId);
  if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);
  if (searchParams.search) params.set("search", searchParams.search);
  params.set("page", searchParams.page || "1");
  params.set("limit", "20");

  try {
    const res = await fetch(`${API}/companies?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], meta: { page: 1, totalPages: 1, total: 0 } };
    const json = await res.json();
    return json;
  } catch {
    return { data: [], meta: { page: 1, totalPages: 1, total: 0 } };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API}/categories?limit=50`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

function buildPageUrl(params: Record<string, string>, overrides: Record<string, string>) {
  const sp = new URLSearchParams();
  const merged = { ...params, ...overrides };
  delete merged.page;
  if (overrides.page && overrides.page !== "1") {
    sp.set("page", overrides.page);
  }
  Object.entries(merged).forEach(([k, v]) => {
    if (k !== "page" && v) sp.set(k, v);
  });
  if (sp.get("sortBy") === "rating") sp.delete("sortBy");
  const qs = sp.toString();
  return qs ? `/firma?${qs}` : "/firma";
}

export default async function FirmaListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([
    getCompanies(params),
    getCategories(),
  ]);

  const companies = result.data || [];
  const meta = result.meta || { page: 1, totalPages: 1, total: 0 };
  const currentPage = Number(params.page || "1");

  const currentSort = params.sortBy || "rating";
  const currentCity = params.city || "";
  const currentCategoryId = params.categoryId || "";
  const currentSearch = params.search || "";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Firmalar</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Tüm Firmalar
      </h1>
      <p className="mt-2 text-gray-600">
        Firmaları keşfedin, memnuniyet yorumlarını okuyun.
        {meta.total > 0 && <span className="ml-1 text-gray-400">({meta.total.toLocaleString("tr-TR")} firma)</span>}
      </p>

      <CompanyFilters
        categories={categories}
        currentCity={currentCity}
        currentCategoryId={currentCategoryId}
        currentSort={currentSort}
        currentSearch={currentSearch}
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
            {currentSearch || currentCity || currentCategoryId
              ? "Aramanıza uygun firma bulunamadı"
              : "Henüz firma bulunmuyor"}
          </div>
        ) : (
          companies.map((company: Record<string, unknown>) => (
            <CompanyCard
              key={company.id as string}
              name={company.name as string}
              slug={company.slug as string}
              logoUrl={(company.logoUrl as string) || null}
              city={(company.city as string) || null}
              isVerified={company.isVerified as boolean}
              avgRating={Number(company.avgRating)}
              reviewCount={company.reviewCount as number}
              memnuniyetScore={Number(company.memnuniyetScore)}
              categoryName={(company.category as Record<string, string>)?.name || null}
              isSponsored={company.isSponsored as boolean}
            />
          ))
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={buildPageUrl(params, { page: String(currentPage - 1) })}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Önceki
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            {currentPage} / {meta.totalPages}
          </span>
          {currentPage < meta.totalPages && (
            <Link
              href={buildPageUrl(params, { page: String(currentPage + 1) })}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Sonraki
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
