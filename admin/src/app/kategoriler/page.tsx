"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  bannerUrl: string | null;
  icon: string | null;
  children: number;
  isActive: boolean;
}

const mockCategories: CategoryItem[] = [
  { id: 1, name: "E-Ticaret", slug: "e-ticaret", bannerUrl: null, icon: null, children: 3, isActive: true },
  { id: 2, name: "Telekomunikasyon", slug: "telekomunikasyon", bannerUrl: null, icon: null, children: 3, isActive: true },
  { id: 3, name: "Bankacilik & Finans", slug: "bankacilik-finans", bannerUrl: null, icon: null, children: 3, isActive: true },
  { id: 4, name: "Seyahat & Konaklama", slug: "seyahat-konaklama", bannerUrl: null, icon: null, children: 3, isActive: true },
  { id: 5, name: "Yemek & Icecek", slug: "yemek-icecek", bannerUrl: null, icon: null, children: 3, isActive: true },
];

export default function KategorilerPage() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Kategori Yonetimi</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Kategori Ekle
        </button>
      </div>

      {/* Category List */}
      <div className="mt-6 space-y-4">
        {mockCategories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-border bg-card-bg overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              {/* Banner Preview */}
              <div className="relative h-20 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-border">
                {cat.bannerUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${cat.bannerUrl})` }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    Banner yok
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <span className={`inline-block h-2 w-2 rounded-full ${cat.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                </div>
                <p className="text-sm text-muted">/{cat.slug} — {cat.children} alt kategori</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingId(editingId === cat.id ? null : cat.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:bg-gray-50"
                >
                  Duzenle
                </button>
              </div>
            </div>

            {/* Edit Form (expandable) */}
            {editingId === cat.id && (
              <div className="border-t border-border bg-gray-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Kategori Adi</label>
                    <input
                      type="text"
                      defaultValue={cat.name}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
                    <input
                      type="text"
                      defaultValue={cat.slug}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Ikon (emoji veya class)</label>
                    <input
                      type="text"
                      defaultValue={cat.icon || ""}
                      placeholder="Orn: shopping-cart"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Aktif</label>
                    <select
                      defaultValue={cat.isActive ? "true" : "false"}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Banner Gorseli</label>
                    <div className="flex items-center gap-4">
                      {cat.bannerUrl && (
                        <div className="relative h-16 w-28 rounded-lg overflow-hidden border border-border">
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${cat.bannerUrl})` }}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover file:cursor-pointer"
                        />
                        <p className="mt-1 text-xs text-muted">Onerilen boyut: 800x400px. JPG, PNG veya WebP.</p>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Aciklama</label>
                    <textarea
                      rows={2}
                      placeholder="Kategori aciklamasi..."
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-gray-100"
                  >
                    Iptal
                  </button>
                  <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                    Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Yeni Kategori Ekle</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Kategori Adi</label>
                <input
                  type="text"
                  placeholder="Orn: E-Ticaret"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ust Kategori (opsiyonel)</label>
                <select className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Ana Kategori</option>
                  {mockCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Banner Gorseli</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover file:cursor-pointer"
                />
                <p className="mt-1 text-xs text-muted">Onerilen boyut: 800x400px. JPG, PNG veya WebP.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Aciklama</label>
                <textarea
                  rows={2}
                  placeholder="Kategori aciklamasi..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-gray-100"
              >
                Iptal
              </button>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
