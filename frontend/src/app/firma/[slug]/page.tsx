import type { Metadata } from "next";
import Link from "next/link";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewListControls } from "./ReviewListControls";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://memnuniyetimvar.com").replace(/\/$/, "");

async function getCompanyData(slug: string, sp: Record<string, string>) {
  try {
    const reviewParams = new URLSearchParams();
    reviewParams.set("page", sp.page || "1");
    reviewParams.set("limit", "10");
    if (sp.sortBy) reviewParams.set("sortBy", sp.sortBy);
    if (sp.rating) reviewParams.set("rating", sp.rating);

    const [companyRes, reviewsRes] = await Promise.all([
      fetch(`${API}/companies/${slug}`, { next: { revalidate: 60 } }),
      fetch(`${API}/companies/${slug}/reviews?${reviewParams.toString()}`, { next: { revalidate: 60 } }),
    ]);

    const company = companyRes.ok ? (await companyRes.json()).data : null;
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [], meta: {} };

    return { company, reviews: reviewsData.data || [], meta: reviewsData.meta || {} };
  } catch {
    return { company: null, reviews: [], meta: {} };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API}/companies/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return { title: "Firma Bulunamadı" };
    const company = (await res.json()).data;
    return {
      title: `${company.name} — Memnuniyet Yorumları`,
      description: `${company.name} firması hakkında memnuniyet yorumları ve değerlendirmeler. MemnuniyetEndeks: ${company.memnuniyetScore || 0}`,
      alternates: { canonical: `/firma/${slug}` },
      openGraph: {
        title: `${company.name} — MemnuniyetimVar`,
        description: `${company.name} firması hakkında memnuniyet yorumları. Ortalama puan: ${company.avgRating}/5`,
        url: `${SITE_URL}/firma/${slug}`,
        type: "website",
        images: company.logoUrl ? [{ url: company.logoUrl, alt: company.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${company.name} — MemnuniyetimVar`,
        description: `${company.name} firması hakkında memnuniyet yorumları.`,
      },
    };
  } catch {
    return { title: slug };
  }
}

interface CompanySeoData {
  name: string;
  website?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  reviewCount: number;
  avgRating: string | number;
}

function CompanyJsonLd({ company, slug }: { company: CompanySeoData; slug: string }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website || `${SITE_URL}/firma/${slug}`,
    logo: company.logoUrl || undefined,
    address: company.city ? { "@type": "PostalAddress", addressLocality: company.city, addressCountry: "TR" } : undefined,
    aggregateRating: company.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(company.avgRating),
      reviewCount: company.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Firmalar", item: `${SITE_URL}/firma` },
      { "@type": "ListItem", position: 3, name: company.name, item: `${SITE_URL}/firma/${slug}` },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, breadcrumb]) }}
    />
  );
}

export default async function FirmaDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { company, reviews, meta } = await getCompanyData(slug, sp);

  if (!company) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Firma Bulunamadı</h1>
        <p className="mt-2 text-gray-500">Aradığınız firma mevcut değil veya kaldırılmış olabilir.</p>
        <Link href="/firma" className="mt-4 inline-block text-primary hover:underline">
          Tüm Firmalara Dön
        </Link>
      </div>
    );
  }

  const currentPage = Number(sp.page || "1");
  const totalPages = meta.totalPages || 1;

  return (
    <div>
      <CompanyJsonLd company={company} slug={slug} />
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
            <span className="mx-2">&gt;</span>
            <Link href="/firma" className="hover:text-primary">Firmalar</Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900">{company.name}</span>
          </nav>

          <CompanyHeader
            name={company.name}
            logoUrl={company.logoUrl}
            coverUrl={company.coverUrl}
            description={company.description}
            website={company.website}
            phone={company.phone}
            city={company.city}
            district={company.district}
            isVerified={company.isVerified}
            avgRating={Number(company.avgRating)}
            reviewCount={company.reviewCount}
            responseRate={Number(company.responseRate)}
            memnuniyetScore={Number(company.memnuniyetScore)}
            categoryName={company.category?.name || null}
            categorySlug={company.category?.slug || null}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Memnuniyet Yorumları ({company.reviewCount})
          </h2>
          <Link
            href={`/memnuniyet/yaz?firma=${slug}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Yorum Yaz
          </Link>
        </div>

        <ReviewListControls currentSort={sp.sortBy || "newest"} currentRating={sp.rating || ""} />

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
              Henüz yorum bulunmuyor. İlk yorumu siz yazın!
            </div>
          ) : (
            reviews.map((review: Record<string, unknown>) => {
              const reviewUser = review.user as Record<string, string> | undefined;
              const responses = (review.companyResponses as Record<string, unknown>[]) || [];

              return (
                <div key={review.id as string}>
                  <ReviewCard
                    slug={review.slug as string}
                    title={review.title as string}
                    content={review.content as string}
                    rating={review.rating as number}
                    helpfulCount={(review.helpfulCount ?? review.helpful_count ?? 0) as number}
                    createdAt={(review.createdAt ?? review.created_at) as string}
                    userName={reviewUser?.fullName || reviewUser?.full_name || "Anonim"}
                    userAvatarUrl={reviewUser?.avatarUrl || reviewUser?.avatar_url || null}
                    companyName={company.name}
                    companySlug={slug}
                    hasResponse={responses.length > 0}
                    verifiedCustomer={review.verifiedCustomer as boolean}
                    tags={(review.tags as { name: string; slug: string }[]) || []}
                  />
                  {responses.length > 0 && (
                    <div className="ml-6 mt-2 rounded-lg border-l-4 border-primary bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                        {company.name} Yanıtladı
                      </div>
                      {responses.map((resp, ri) => (
                        <p key={ri} className="mt-2 text-sm text-gray-700">
                          {resp.content as string}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/firma/${slug}?page=${currentPage - 1}${sp.sortBy ? `&sortBy=${sp.sortBy}` : ""}${sp.rating ? `&rating=${sp.rating}` : ""}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Önceki
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/firma/${slug}?page=${currentPage + 1}${sp.sortBy ? `&sortBy=${sp.sortBy}` : ""}${sp.rating ? `&rating=${sp.rating}` : ""}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Sonraki
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
