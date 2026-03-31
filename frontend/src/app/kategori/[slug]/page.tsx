import type { Metadata } from "next";
import Link from "next/link";
import { CompanyCard } from "@/components/company/CompanyCard";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCategoryWithCompanies(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  try {
    const [catRes, companiesRes] = await Promise.all([
      fetch(`${apiUrl}/categories/${slug}`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/companies/by-category/${slug}?limit=20`, { next: { revalidate: 60 } }),
    ]);

    const category = catRes.ok ? (await catRes.json()).data : null;
    const companiesData = companiesRes.ok ? await companiesRes.json() : { data: [] };

    return { category, companies: companiesData.data || [] };
  } catch {
    return { category: null, companies: [] };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getCategoryWithCompanies(slug);
  const name = category?.name || slug.replace(/-/g, " ");
  return {
    title: `${name} Firmaları`,
    description: `${name} kategorisindeki en iyi firmaları keşfedin.`,
  };
}

export default async function KategoriDetailPage({ params }: Props) {
  const { slug } = await params;
  const { category, companies } = await getCategoryWithCompanies(slug);
  const categoryName = category?.name || slug.replace(/-/g, " ");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/kategori" className="hover:text-primary">Kategoriler</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">{categoryName}</span>
      </nav>

      {category?.bannerUrl && (
        <div className="relative h-48 w-full rounded-xl overflow-hidden mb-6">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${category.bannerUrl})` }}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-display)]">
              {categoryName}
            </h1>
          </div>
        </div>
      )}

      {!category?.bannerUrl && (
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900 capitalize">
          {categoryName}
        </h1>
      )}

      {category?.description && (
        <p className="mt-2 text-gray-600">{category.description}</p>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
            Bu kategoride henüz firma bulunmuyor
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
              categoryName={categoryName}
            />
          ))
        )}
      </div>
    </div>
  );
}
