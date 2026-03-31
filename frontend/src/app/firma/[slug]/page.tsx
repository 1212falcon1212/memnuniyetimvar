import type { Metadata } from "next";
import Link from "next/link";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { ReviewCard } from "@/components/review/ReviewCard";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCompanyData(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  try {
    const [companyRes, reviewsRes] = await Promise.all([
      fetch(`${apiUrl}/companies/${slug}`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/companies/${slug}/reviews?limit=10`, { next: { revalidate: 60 } }),
    ]);

    const company = companyRes.ok ? (await companyRes.json()).data : null;
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [], meta: {} };

    return { company, reviews: reviewsData.data || [], meta: reviewsData.meta };
  } catch {
    return { company: null, reviews: [], meta: {} };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { company } = await getCompanyData(slug);
  const name = company?.name || slug;
  return {
    title: `${name} — Memnuniyet Yorumları`,
    description: `${name} firması hakkında memnuniyet yorumları ve değerlendirmeler. MemnuniyetEndeks: ${company?.memnuniyetScore || 0}`,
  };
}

export default async function FirmaDetailPage({ params }: Props) {
  const { slug } = await params;
  const { company, reviews } = await getCompanyData(slug);

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

  return (
    <div>
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

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
              Henüz yorum bulunmuyor. İlk yorumu siz yazın!
            </div>
          ) : (
            reviews.map((review: Record<string, unknown>) => (
              <ReviewCard
                key={review.id as string}
                slug={review.slug as string}
                title={review.title as string}
                content={review.content as string}
                rating={review.rating as number}
                helpfulCount={review.helpfulCount as number}
                createdAt={review.createdAt as string}
                userName={(review.user as Record<string, string>)?.fullName || "Anonim"}
                userAvatarUrl={(review.user as Record<string, string>)?.avatarUrl || null}
                companyName={company.name}
                companySlug={slug}
                hasResponse={!!(review.companyResponses as unknown[])?.length}
                tags={(review.tags as { name: string; slug: string }[]) || []}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
