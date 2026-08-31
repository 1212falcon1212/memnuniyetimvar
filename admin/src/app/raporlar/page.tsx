"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api, { getResponseList, getResponseTotalPages } from "@/lib/api";

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporter: { fullName: string };
  review: { title: string; id: string };
}

export default function RaporlarPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      const res = await api.get("/admin/reports", { params });
      setReports(getResponseList<Report>(res.data));
      setTotalPages(getResponseTotalPages(res.data));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (id: string, action: "review" | "dismiss") => {
    await api.patch(`/admin/reports/${id}/${action}`);
    fetchReports();
  };

  const reasonLabels: Record<string, string> = {
    spam: "Spam",
    fake: "Sahte",
    inappropriate: "Uygunsuz",
    other: "Diğer",
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Rapor Yönetimi</h1>

      <div className="mt-4 flex gap-2">
        {[{ label: "Tümü", value: "" }, { label: "Bekleyen", value: "pending" }, { label: "İncelendi", value: "reviewed" }, { label: "Reddedildi", value: "dismissed" }].map((s) => (
          <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-sm ${status === s.value ? "bg-primary text-white" : "border border-border text-muted hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Raporlayan</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Yorum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Sebep</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Rapor bulunamadı</td></tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{report.reporter?.fullName}</td>
                  <td className="px-4 py-3">{report.review?.title}</td>
                  <td className="px-4 py-3">{reasonLabels[report.reason] || report.reason}</td>
                  <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                  <td className="px-4 py-3">
                    {report.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(report.id, "review")} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">İncele</button>
                        <button onClick={() => handleAction(report.id, "dismiss")} className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">Reddet</button>
                      </div>
                    )}
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
