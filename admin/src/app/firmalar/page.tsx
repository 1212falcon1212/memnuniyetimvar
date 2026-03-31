"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import api from "@/lib/api";

interface Company {
  id: string;
  name: string;
  slug: string;
  avgRating: number;
  reviewCount: number;
  status: string;
  category?: { name: string };
}

export default function FirmalarPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/companies", { params: { page, limit: 20 } });
      setCompanies(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/admin/companies/${deleteTarget.id}`);
    setDeleteTarget(null);
    fetchCompanies();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Firma Yönetimi</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Firma Ekle
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Firma</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Kategori</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Puan</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Yorum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yükleniyor...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Firma bulunamadı</td></tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{company.name}</td>
                  <td className="px-4 py-3 text-muted">{company.category?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="text-amber-500">★</span> {Number(company.avgRating).toFixed(1)}
                  </td>
                  <td className="px-4 py-3">{company.reviewCount.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3"><StatusBadge status={company.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Düzenle</button>
                      <button onClick={() => setDeleteTarget(company)} className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Sil</button>
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
          title="Firma Sil"
          message={`"${deleteTarget.name}" firmasını silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}
    </AdminLayout>
  );
}
