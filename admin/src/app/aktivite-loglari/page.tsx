"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import api, { getResponseList } from "@/lib/api";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details?: Record<string, unknown> | null;
  createdAt?: string;
  created_at?: string;
  admin?: { full_name?: string; fullName?: string; email?: string };
}

export default function AktiviteLoglariPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/activity-logs", { params: { limit: 100 } })
      .then((res) => setLogs(getResponseList<ActivityLog>(res.data)))
      .catch(() => setError("Aktivite logları yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Aktivite Logları</h1>
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Admin</th>
              <th className="px-4 py-3 text-left font-medium text-muted">İşlem</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Varlık</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Log bulunamadı.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{log.admin?.fullName || log.admin?.full_name || log.admin?.email || "-"}</td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3 text-muted">{log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</td>
                <td className="px-4 py-3 text-muted">{new Date(log.createdAt || log.created_at || "").toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
