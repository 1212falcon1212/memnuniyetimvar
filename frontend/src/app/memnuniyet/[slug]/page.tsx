import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, renderStars } from "@/lib/utils";
import type { Review } from "@/types/review";
import type { ApiResponse } from "@/types/api";
import { HelpfulButton } from "@/components/review/HelpfulButton";
import { ImageGallery } from "@/components/review/ImageGallery";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getReview(slug: string): Promise<Review | null> {
  try {
    const response = await fetch(`${API_BASE}/reviews/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const json: ApiResponse<Review> = await response.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReview(slug);

  if (!review) {
    return {
      title: "Yorum Bulunamadi",
    };
  }

  return {
    title: `${review.title} — ${review.company.name}`,
    description: review.content.slice(0, 160),
    openGraph: {
      title: `${review.title} — ${review.company.name}`,
      description: review.content.slice(0, 160),
      type: "article",
    },
  };
}

function ReviewNotFound() {
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
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Yorum Bulunamadi
      </h1>
      <p className="mt-2 text-gray-500">
        Aradiginiz yorum silinmis veya mevcut olmayabilir.
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

export default async function ReviewDetailPage({ params }: Props) {
  const { slug } = await params;
  const review = await getReview(slug);

  if (!review) {
    return <ReviewNotFound />;
  }

  const stars = renderStars(review.rating);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">
              Ana Sayfa
            </Link>
            <span className="mx-2">&gt;</span>
            <Link
              href={`/firma/${review.company.slug}`}
              className="hover:text-primary transition-colors"
            >
              {review.company.name}
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900">Yorum</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Review Card */}
        <article className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          {/* Rating & Title */}
          <div>
            <span className="text-accent text-2xl tracking-wide">{stars}</span>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
              {review.title}
            </h1>
          </div>

          {/* Author & Company info */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              {review.user.avatarUrl ? (
                <img
                  src={review.user.avatarUrl}
                  alt={review.user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {review.user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-gray-700">
                {review.user.fullName}
              </span>
            </div>
            <span className="hidden sm:inline">|</span>
            <Link
              href={`/firma/${review.company.slug}`}
              className="flex items-center gap-2 font-medium text-primary hover:underline"
            >
              {review.company.logoUrl && (
                <img
                  src={review.company.logoUrl}
                  alt={review.company.name}
                  className="h-5 w-5 rounded object-contain"
                />
              )}
              {review.company.name}
            </Link>
            <span className="hidden sm:inline">|</span>
            <time dateTime={review.publishedAt || review.createdAt}>
              {formatDate(review.publishedAt || review.createdAt)}
            </time>
          </div>

          {/* Content */}
          <div className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
            {review.content}
          </div>

          {/* Images */}
          {review.images.length > 0 && (
            <div className="mt-6">
              <ImageGallery images={review.images} />
            </div>
          )}

          {/* Tags */}
          {review.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {review.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/etiket/${tag.slug}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
            <HelpfulButton
              reviewId={review.id}
              initialCount={review.helpfulCount}
              isHelpful={false}
            />
            <button
              type="button"
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Sikayet Et
            </button>
          </div>
        </article>

        {/* Company Response */}
        {review.companyResponse && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                Firma Yaniti
              </span>
              {review.companyResponse.responderName && (
                <span className="text-sm text-gray-600">
                  — {review.companyResponse.responderName}
                </span>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {review.companyResponse.content}
            </p>
            <p className="mt-3 text-xs text-gray-500">
              {formatDate(review.companyResponse.createdAt)}
            </p>
          </div>
        )}

        {/* Related Reviews Placeholder */}
        <div className="mt-8">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-gray-900">
            Benzer Yorumlar
          </h2>
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
            Benzer yorumlar API entegrasyonuyla yuklenecek.
          </div>
        </div>

        {/* View stats */}
        <div className="mt-6 text-center text-xs text-gray-400">
          {review.viewCount} kez goruntulendi
        </div>
      </div>
    </div>
  );
}
