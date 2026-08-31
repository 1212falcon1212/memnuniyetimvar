"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api, { getResponseList, getResponseTotalPages } from "@/lib/api";

interface AdRequest {
  id: string;
  type: string;
  status: string;
  budget: number | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  company: { name: string; slug: string } | null;
  package: { name: string } | null;
}

const typeLabels: Record<string, string> = {
  sponsored_showcase: "Sponsorlu Vitrin",
  featured_campaign: "Öne Çıkan Kampanya",
  category_sponsorship: "Kategori Sponsorluğu",
};

export default function ReklamlarPage() {
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      const res = await api.get("/admin/advertising/requests", { params });
      setRequests(getResponseList<AdRequest>(res.data));
      setTotalPages(getResponseTotalPages(res.data));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcess = async (id: string, newStatus: string) => {
    await api.patch(`/admin/advertising/requests/${id}`, { status: newStatus });
    fetchRequests();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Reklam Talepleri</h1>
      <p className="mt-1 text-sm text-muted">
        Sponsorlu içerik talepleri — onay, red, yayın takvimi ve performans.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "Tümü", value: "" },
          { label: "Bekleyen", value: "pending" },
          { label: "Onaylı", value: "approved" },
          { label: "Aktif", value: "active" },
          { label: "Reddedildi", value: "rejected" },
          { label: "Tamamlandı", value: "completed" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setStatus(s.value);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              status === s.value ? "bg-primary text-white" : "border border-border text-muted hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Firma</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Tür</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Bütçe</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Gösterim / Tıklama</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Reklam talebi bulunamadı</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{req.company?.name ?? "—"}</td>
                  <td className="px-4 py-3">{typeLabels[req.type] || req.type}</td>
                  <td className="px-4 py-3">{req.budget != null ? `${Number(req.budget).toLocaleString("tr-TR")} ₺` : "—"}</td>
                  <td className="px-4 py-3">{req.impressions} / {req.clicks}</td>
                  <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {req.status === "pending" && (
                        <>
                          <button onClick={() => handleProcess(req.id, "approved")} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Onayla</button>
                          <button onClick={() => handleProcess(req.id, "rejected")} className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Reddet</button>
                        </>
                      )}
                      {req.status === "approved" && (
                        <button onClick={() => handleProcess(req.id, "active")} className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Yayınla</button>
                      )}
                      {req.status === "active" && (
                        <button onClick={() => handleProcess(req.id, "completed")} className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">Tamamla</button>
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
