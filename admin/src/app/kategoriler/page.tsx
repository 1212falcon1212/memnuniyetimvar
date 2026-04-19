"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import api from "@/lib/api";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  bannerUrl: string | null;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  reviewCount: number;
  children?: CategoryItem[];
}

export default function KategorilerPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", icon: "", isActive: true, description: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", parentId: "", description: "" });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data.data || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      isActive: cat.isActive,
      description: cat.description || "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    await api.patch(`/api/admin/categories/${editingId}`, editForm);
    setEditingId(null);
    fetchCategories();
  };

  const handleAdd = async () => {
    await api.post("/api/admin/categories", {
      name: newCategory.name,
      parentId: newCategory.parentId ? Number(newCategory.parentId) : null,
      description: newCategory.description || null,
    });
    setShowAddModal(false);
    setNewCategory({ name: "", parentId: "", description: "" });
    fetchCategories();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Kategori Yönetimi</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Kategori Ekle
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-center text-muted py-8">Yükleniyor...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-muted py-8">Kategori bulunamadı</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-border bg-card-bg overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="relative h-20 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-border">
                  {cat.bannerUrl ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cat.bannerUrl})` }} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">Banner yok</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                    <span className={`inline-block h-2 w-2 rounded-full ${cat.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                  <p className="text-sm text-muted">/{cat.slug} — {cat.reviewCount} yorum</p>
                </div>
                <button
                  onClick={() => editingId === cat.id ? setEditingId(null) : startEdit(cat)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:bg-gray-50"
                >
                  Düzenle
                </button>
              </div>

              {editingId === cat.id && (
                <div className="border-t border-border bg-gray-50 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Kategori Adı</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
                      <input type="text" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">İkon</label>
                      <input type="text" value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Aktif</label>
                      <select value={editForm.isActive.toString()} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Açıklama</label>
                      <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-gray-100">İptal</button>
                    <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">Kaydet</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Yeni Kategori Ekle</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Kategori Adı</label>
                <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Örn: E-Ticaret"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Üst Kategori (opsiyonel)</label>
                <select value={newCategory.parentId} onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Ana Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Açıklama</label>
                <textarea rows={2} value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-gray-100">İptal</button>
              <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
