import type { Metadata } from "next";
import Link from "next/link";
import { ReviewCard } from "@/components/review/ReviewCard";
import type { Review } from "@/types/review";
import type { ApiResponse } from "@/types/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Props {
  params: Promise<{ slug: string }>;
}

interface TagReviewsData {
  tag: {
    id: number;
    name: string;
    slug: string;
    reviewCount: number;
  };
  reviews: Review[];
}

async function getTagReviews(slug: string): Promise<TagReviewsData | null> {
  try {
    const response = await fetch(`${API_BASE}/tags/${slug}/reviews`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const json: ApiResponse<TagReviewsData> = await response.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const data = await getTagReviews(slug);
  const tagName = data?.tag.name || slug;

  return {
    title: `#${tagName} Etiketli Yorumlar`,
    description: `${tagName} etiketine sahip memnuniyet yorumlari ve degerlendirmeler.`,
  };
}

function TagNotFound({ slug }: { slug: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Etiket Bulunamadi
      </h1>
      <p className="mt-2 text-gray-500">
        &quot;{slug}&quot; etiketine ait yorum bulunamadi.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
      >
        Ana Sayfaya Don
      </Link>
    </div>
  );
}

export default async function TagReviewsPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTagReviews(slug);

  if (!data) {
    return <TagNotFound slug={slug} />;
  }

  const { tag, reviews } = data;

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">
              Ana Sayfa
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900">#{tag.name}</span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              #
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-gray-900">
                {tag.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {tag.reviewCount} yorum bu etikete sahip
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-gray-400">
              Bu etikete ait henuz yorum bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                slug={review.slug}
                title={review.title}
                content={review.content}
                rating={review.rating}
                helpfulCount={review.helpfulCount}
                createdAt={review.createdAt}
                userName={review.user.fullName}
                userAvatarUrl={review.user.avatarUrl}
                companyName={review.company.name}
                companySlug={review.company.slug}
                hasResponse={review.companyResponse !== null}
                tags={review.tags}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
