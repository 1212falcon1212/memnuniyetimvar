"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import api, { getResponseList, getResponseTotalPages } from "@/lib/api";

const tabs = [
  { label: "Tümü", value: "" },
  { label: "Bekleyen", value: "pending" },
  { label: "Onaylanan", value: "published" },
  { label: "Reddedilen", value: "rejected" },
];

interface Review {
  id: string;
  title: string;
  content?: string;
  rating: number;
  status: string;
  isFeatured?: boolean;
  createdAt: string;
  user: { fullName?: string; full_name?: string; email?: string };
  company: { name: string };
}

export default function YorumlarPage() {
  const [activeTab, setActiveTab] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [detailTarget, setDetailTarget] = useState<Review | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (activeTab) params.status = activeTab;
      const res = await api.get("/admin/reviews", { params });
      setReviews(getResponseList<Review>(res.data));
      setTotalPages(getResponseTotalPages(res.data));
      setSelectedIds([]);
    } catch {
      setError("Yorumlar yüklenemedi.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    await api.patch(`/admin/reviews/${id}/${action}`, action === "reject" ? { reason: "Admin tarafından reddedildi" } : undefined);
    fetchReviews();
  };

  const handleFeature = async (id: string) => {
    await api.patch(`/admin/reviews/${id}/feature`);
    fetchReviews();
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    await Promise.all(selectedIds.map((id) => api.patch(`/admin/reviews/${id}/${action}`, action === "reject" ? { reason: "Toplu işlem ile reddedildi" } : undefined)));
    fetchReviews();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/admin/reviews/${deleteTarget.id}`);
    setDeleteTarget(null);
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

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {selectedIds.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card-bg p-3">
          <span className="text-sm text-muted">{selectedIds.length} yorum seçildi</span>
          <button onClick={() => handleBulkAction("approve")} className="rounded bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100">Toplu Onayla</button>
          <button onClick={() => handleBulkAction("reject")} className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Toplu Reddet</button>
          <button onClick={() => setSelectedIds([])} className="rounded border px-3 py-1 text-xs text-muted">Seçimi Temizle</button>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Seç</th>
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
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Yorum bulunamadı</td></tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(review.id)} onChange={() => toggleSelected(review.id)} /></td>
                  <td className="px-4 py-3 font-medium">{review.user?.fullName || review.user?.full_name || review.user?.email || "-"}</td>
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
                      <button onClick={() => setDetailTarget(review)} className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">Detay</button>
                      <button onClick={() => handleFeature(review.id)} className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">{review.isFeatured ? "Öne Çıkarma" : "Öne Çıkar"}</button>
                      <button onClick={() => setDeleteTarget(review)} className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Sil</button>
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

      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Yorumu Sil"
          message={`"${deleteTarget.title}" yorumunu silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}

      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{detailTarget.title}</h2>
              <button onClick={() => setDetailTarget(null)} className="text-sm text-muted hover:text-foreground">Kapat</button>
            </div>
            <div className="mt-3 text-amber-500">{"★".repeat(detailTarget.rating)}</div>
            <p className="mt-3 whitespace-pre-line text-sm text-muted">{detailTarget.content || "İçerik bulunmuyor."}</p>
            <div className="mt-4 text-xs text-muted">
              {detailTarget.user?.fullName || detailTarget.user?.full_name || detailTarget.user?.email || "Kullanıcı"} → {detailTarget.company?.name || "Firma"}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
