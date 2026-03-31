import type { Metadata } from "next";
import Link from "next/link";
import { CompanyCard } from "@/components/company/CompanyCard";

export const metadata: Metadata = {
  title: "Firmalar",
  description: "MemnuniyetimVar'da kayıtlı tüm firmaları keşfedin, değerlendirmeleri okuyun.",
};

async function getCompanies(searchParams: Record<string, string>) {
  const params = new URLSearchParams();
  if (searchParams.city) params.set("city", searchParams.city);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  params.set("page", searchParams.page || "1");
  params.set("limit", "20");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  try {
    const res = await fetch(`${apiUrl}/companies?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { data: [], meta: { page: 1, totalPages: 1, total: 0 } };
    const json = await res.json();
    return json;
  } catch {
    return { data: [], meta: { page: 1, totalPages: 1, total: 0 } };
  }
}

export default async function FirmaListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const result = await getCompanies(params);
  const companies = result.data || [];
  const meta = result.meta || { page: 1, totalPages: 1, total: 0 };
  const currentPage = Number(params.page || "1");

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

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          defaultValue={params.city || ""}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm Şehirler</option>
          <option value="istanbul">İstanbul</option>
          <option value="ankara">Ankara</option>
          <option value="izmir">İzmir</option>
        </select>
        <select
          defaultValue={params.sort || "rating"}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="rating">En Yüksek Puan</option>
          <option value="reviews">En Çok Yorum</option>
          <option value="name">İsim (A-Z)</option>
        </select>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
            Henüz firma bulunmuyor
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
            />
          ))
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/firma?page=${currentPage - 1}`}
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
              href={`/firma?page=${currentPage + 1}`}
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
