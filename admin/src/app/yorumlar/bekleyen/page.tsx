"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api, { getResponseList } from "@/lib/api";

interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: string;
  user?: { fullName?: string; full_name?: string };
  company?: { name?: string };
}

export default function BekleyenYorumlarPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReviews() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/reviews", { params: { status: "pending", limit: 50 } });
      setReviews(getResponseList<Review>(res.data));
    } catch {
      setError("Bekleyen yorumlar yüklenemedi.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchReviews(); }, []);

  async function handleAction(id: string, action: "approve" | "reject" | "feature") {
    await api.patch(`/admin/reviews/${id}/${action}`, action === "reject" ? { reason: "Admin tarafından reddedildi" } : undefined);
    await fetchReviews();
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Bekleyen Yorumlar</h1>
      <p className="mt-1 text-sm text-muted">Onay bekleyen yorumları inceleyin</p>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-xl border border-border bg-card-bg p-8 text-center text-muted">Yükleniyor...</div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-border bg-card-bg p-8 text-center text-muted">Bekleyen yorum bulunmuyor.</div>
        ) : reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-border bg-card-bg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{review.user?.fullName || review.user?.full_name || "Kullanıcı"}</span>
                  <span className="text-muted">→</span>
                  <span className="font-medium text-primary">{review.company?.name || "Firma"}</span>
                  <StatusBadge status={review.status} />
                </div>
                <div className="mt-1 text-amber-500">{"★".repeat(review.rating)}</div>
                <h3 className="mt-2 font-semibold">{review.title}</h3>
                <p className="mt-1 text-sm text-muted line-clamp-3">{review.content}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => handleAction(review.id, "approve")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Onayla</button>
              <button onClick={() => handleAction(review.id, "reject")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reddet</button>
              <button onClick={() => handleAction(review.id, "feature")} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-gray-50">Öne Çıkar</button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
