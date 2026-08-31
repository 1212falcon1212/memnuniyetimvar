"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import api, { getResponseList, getResponseTotalPages } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  slug: string;
  avgRating: number;
  reviewCount: number;
  status: string;
  category?: { name: string };
  categoryId?: number | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  description?: string | null;
}

interface Category { id: number; name: string; }

const emptyForm = { name: "", website: "", email: "", phone: "", city: "", description: "", status: "active", categoryId: "" };

export default function FirmalarPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/companies", { params: { page, limit: 20 } });
      setCompanies(getResponseList<Company>(res.data));
      setTotalPages(getResponseTotalPages(res.data));
    } catch {
      setError("Firmalar yüklenemedi.");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    api.get("/admin/categories")
      .then((res) => setCategories(getResponseList<Category>(res.data)))
      .catch(() => setCategories([]));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/admin/companies/${deleteTarget.id}`);
    setDeleteTarget(null);
    fetchCompanies();
  };

  const openCreate = () => {
    setEditingCompany(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({
      ...emptyForm,
      name: company.name,
      status: company.status,
      website: company.website || "",
      email: company.email || "",
      phone: company.phone || "",
      city: company.city || "",
      description: company.description || "",
      categoryId: company.categoryId ? String(company.categoryId) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      website: form.website || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      city: form.city || undefined,
      description: form.description || undefined,
      status: form.status,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
    };

    if (editingCompany) {
      await api.patch(`/admin/companies/${editingCompany.id}`, payload);
    } else {
      await api.post("/admin/companies", payload);
    }

    setShowForm(false);
    fetchCompanies();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Firma Yönetimi</h1>
        <button onClick={openCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Firma Ekle
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
                      <button onClick={() => openEdit(company)} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Düzenle</button>
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
          open={Boolean(deleteTarget)}
          title="Firma Sil"
          message={`"${deleteTarget.name}" firmasını silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{editingCompany ? "Firma Düzenle" : "Firma Ekle"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required placeholder="Firma adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border px-3 py-2 text-sm" />
               <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded border px-3 py-2 text-sm">
                <option value="active">Aktif</option>
                <option value="pending">Beklemede</option>
                <option value="hidden">Gizli</option>
               </select>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded border px-3 py-2 text-sm">
                <option value="">Kategori seç</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="E-posta" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="Şehir" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded border px-3 py-2 text-sm" />
              <textarea placeholder="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border px-3 py-2 text-sm sm:col-span-2" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-2 text-sm">İptal</button>
              <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-medium text-white">Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
