"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api from "@/lib/api";

const tabs = [
  { label: "Tümü", value: "" },
  { label: "Bekleyen", value: "pending" },
  { label: "Onaylanan", value: "published" },
  { label: "Reddedilen", value: "rejected" },
];

interface Review {
  id: string;
  title: string;
  rating: number;
  status: string;
  createdAt: string;
  user: { fullName: string };
  company: { name: string };
}

export default function YorumlarPage() {
  const [activeTab, setActiveTab] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (activeTab) params.status = activeTab;
      const res = await api.get("/api/admin/reviews", { params });
      setReviews(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    await api.patch(`/api/admin/reviews/${id}/${action}`);
    fetchReviews();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Yorum Yönetimi</h1>
      </div>

      <div className="mt-4 flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Kullanıcı</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Firma</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Puan</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Tarih</th>
              <th className="px-4 py-3 text-left font-medium text-muted">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yorum bulunamadı</td></tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{review.user?.fullName}</td>
                  <td className="px-4 py-3">{review.company?.name}</td>
                  <td className="px-4 py-3 text-amber-500">{"★".repeat(review.rating)}</td>
                  <td className="px-4 py-3"><StatusBadge status={review.status} /></td>
                  <td className="px-4 py-3 text-muted">{formatDate(review.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {review.status === "pending" && (
                        <>
                          <button onClick={() => handleAction(review.id, "approve")} className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">Onayla</button>
                          <button onClick={() => handleAction(review.id, "reject")} className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Reddet</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Önceki</button>
          <span className="px-3 py-1 text-sm text-muted">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}
    </AdminLayout>
  );
}
