import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface ReviewCardProps {
  slug: string;
  title: string;
  content: string;
  rating: number;
  helpfulCount: number;
  createdAt: string;
  userName: string;
  userAvatarUrl: string | null;
  companyName: string;
  companySlug: string;
  hasResponse: boolean;
  tags?: { name: string; slug: string }[];
}

export function ReviewCard({
  slug,
  title,
  content,
  rating,
  helpfulCount,
  createdAt,
  userName,
  companyName,
  companySlug,
  hasResponse,
  tags,
}: ReviewCardProps) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-accent text-lg tracking-wide">{stars}</span>
          <Link
            href={`/memnuniyet/${slug}`}
            className="mt-1 block text-base font-semibold text-gray-900 hover:text-primary transition-colors"
          >
            {title}
          </Link>
        </div>
        <span className="flex-shrink-0 text-xs text-gray-400">
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      {/* Author & Company */}
      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{userName}</span>
        <span>→</span>
        <Link href={`/firma/${companySlug}`} className="font-medium text-primary hover:underline">
          {companyName}
        </Link>
      </div>

      {/* Content */}
      <p className="mt-3 text-sm text-gray-600 line-clamp-3">{content}</p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
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

      {/* Footer */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="text-gray-500">👍 {helpfulCount} kişi faydalı buldu</span>
        {hasResponse && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-primary">
            💬 Firma Yanıtladı
          </span>
        )}
      </div>
    </div>
  );
}
