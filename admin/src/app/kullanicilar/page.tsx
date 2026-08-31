"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api, { getResponseList, getResponseTotalPages } from "@/lib/api";

interface User {
  id: string;
  fullName?: string;
  full_name?: string;
  email: string;
  phone?: string;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  reviewCount: number;
  review_count?: number;
  helpful_count?: number;
  status: string;
}

export default function KullanicilarPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [detailTarget, setDetailTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      const res = await api.get("/admin/users", { params });
      setUsers(getResponseList<User>(res.data));
      setTotalPages(getResponseTotalPages(res.data));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBan = async (user: User) => {
    const action = user.status === "active" ? "ban" : "unban";
    await api.patch(`/admin/users/${user.id}/${action}`);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Kullanıcı Yönetimi</h1>

      <div className="mt-4 flex gap-2">
        {[{ label: "Tümü", value: "" }, { label: "Aktif", value: "active" }, { label: "Engelli", value: "banned" }].map((s) => (
          <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-sm ${status === s.value ? "bg-primary text-white" : "border border-border text-muted hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Ad Soyad</th>
              <th className="px-4 py-3 text-left font-medium text-muted">E-posta</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Yorum Sayısı</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Kullanıcı bulunamadı</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.fullName || user.full_name || "-"}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">{user.reviewCount ?? user.review_count ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setDetailTarget(user)} className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">Detay</button>
                      <button
                        onClick={() => handleToggleBan(user)}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          user.status === "active"
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {user.status === "active" ? "Engelle" : "Engeli Kaldır"}
                      </button>
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

      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{detailTarget.fullName || detailTarget.full_name || "Kullanıcı"}</h2>
              <button onClick={() => setDetailTarget(null)} className="text-sm text-muted hover:text-foreground">Kapat</button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted">E-posta:</span> {detailTarget.email}</p>
              <p><span className="text-muted">Telefon:</span> {detailTarget.phone || "-"}</p>
              <p><span className="text-muted">Yorum:</span> {detailTarget.reviewCount ?? detailTarget.review_count ?? 0}</p>
              <p><span className="text-muted">Faydalı Oy:</span> {detailTarget.helpful_count ?? 0}</p>
              <p><span className="text-muted">Telefon Doğrulama:</span> {detailTarget.is_phone_verified ? "Evet" : "Hayır"}</p>
              <p><span className="text-muted">E-posta Doğrulama:</span> {detailTarget.is_email_verified ? "Evet" : "Hayır"}</p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
