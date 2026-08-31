"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import api, { getResponseList } from "@/lib/api";

interface PageItem {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
}

const emptyForm = { title: "", slug: "", content: "", metaTitle: "", metaDescription: "", isPublished: true };

export default function SayfalarPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function fetchPages() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/pages");
      setPages(getResponseList<PageItem>(res.data));
    } catch {
      setError("Sayfalar yüklenemedi.");
      setPages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchPages(); }, []);

  function openCreate() {
    setEditingPage(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(page: PageItem) {
    setEditingPage(page);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      metaTitle: page.meta_title || "",
      metaDescription: page.meta_description || "",
      isPublished: page.is_published,
    });
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (editingPage) {
      await api.patch(`/admin/pages/${editingPage.id}`, form);
    } else {
      await api.post("/admin/pages", form);
    }
    setShowForm(false);
    await fetchPages();
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Sayfa Yonetimi</h1>
        <button onClick={openCreate} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">Sayfa Ekle</button>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Baslik</th><th className="px-4 py-3 text-left">Slug</th><th className="px-4 py-3 text-left">Yayinda</th><th className="px-4 py-3 text-left">Islemler</th></tr></thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={4} className="p-6 text-center">Yükleniyor...</td></tr> : pages.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted">Sayfa bulunamadı.</td></tr> : pages.map((page) => (
              <tr key={page.id}>
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 text-muted">/{page.slug}</td>
                <td className="px-4 py-3"><span className={`inline-block h-2 w-2 rounded-full ${page.is_published ? "bg-green-500" : "bg-gray-300"}`} /></td>
                <td className="px-4 py-3"><button onClick={() => openEdit(page)} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Duzenle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{editingPage ? "Sayfa Düzenle" : "Sayfa Ekle"}</h2>
            <div className="mt-4 space-y-3">
              <input required placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
              <input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
              <textarea rows={8} placeholder="İçerik" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
              <input placeholder="Meta başlık" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
              <input placeholder="Meta açıklama" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="w-full rounded border px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Yayında</label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-2 text-sm">İptal</button><button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-medium text-white">Kaydet</button></div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
