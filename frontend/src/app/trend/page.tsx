import type { Metadata } from "next";
import Link from "next/link";
import { CompanyCard } from "@/components/company/CompanyCard";

export const metadata: Metadata = {
  title: "Trend Firmalar",
  description: "Son 7 günde en çok memnuniyet yorumu alan firmalar.",
};

async function getTrendingCompanies() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  try {
    const res = await fetch(`${apiUrl}/companies/trending?limit=20`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function TrendPage() {
  const companies = await getTrendingCompanies();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Trend Firmalar</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Trend Firmalar
      </h1>
      <p className="mt-2 text-gray-600">
        Son 7 günde en çok memnuniyet yorumu alan firmalar.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
            Henüz trend firma bulunmuyor
          </div>
        ) : (
          companies.map((company: Record<string, unknown>, index: number) => (
            <div key={company.id as string} className="relative">
              <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow">
                {index + 1}
              </div>
              <CompanyCard
                name={company.name as string}
                slug={company.slug as string}
                logoUrl={(company.logoUrl as string) || null}
                city={(company.city as string) || null}
                isVerified={company.isVerified as boolean}
                avgRating={Number(company.avgRating)}
                reviewCount={company.reviewCount as number}
                memnuniyetScore={Number(company.memnuniyetScore)}
                categoryName={null}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
