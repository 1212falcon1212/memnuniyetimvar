import Link from "next/link";
import { ReviewCard } from "@/components/review/ReviewCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default async function MemnuniyetlerPage() {
  const res = await fetch(`${API}/reviews/latest?limit=30`, { cache: "no-store" });
  const json = res.ok ? await res.json() : { data: [] };
  const reviews = Array.isArray(json.data) ? json.data : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500"><Link href="/">Ana Sayfa</Link><span className="mx-2">&gt;</span><span>Memnuniyetler</span></nav>
      <h1 className="text-2xl font-bold">Son Memnuniyetler</h1>
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-gray-400">Henüz yayınlanmış yorum yok.</div> : reviews.map((review: any) => (
          <ReviewCard
            key={review.id}
            slug={review.slug}
            title={review.title}
            content={review.content}
            rating={review.rating}
            helpfulCount={review.helpfulCount || 0}
            createdAt={review.createdAt}
            userName={review.user?.fullName || review.user?.full_name || "Anonim"}
            userAvatarUrl={review.user?.avatarUrl || review.user?.avatar_url || null}
            companyName={review.company?.name || "Firma"}
            companySlug={review.company?.slug || "#"}
            hasResponse={false}
            verifiedCustomer={review.verifiedCustomer}
            tags={review.tags || []}
          />
        ))}
      </div>
    </div>
  );
}
