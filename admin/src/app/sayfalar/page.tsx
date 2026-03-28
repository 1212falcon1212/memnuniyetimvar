"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";

const mockPages = [
  { id: 1, title: "Hakkimizda", slug: "hakkimizda", isPublished: true },
  { id: 2, title: "KVKK Aydinlatma Metni", slug: "kvkk", isPublished: true },
  { id: 3, title: "Kullanim Kosullari", slug: "kullanim-kosullari", isPublished: true },
  { id: 4, title: "Iletisim", slug: "iletisim", isPublished: false },
];

export default function SayfalarPage() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Sayfa Yonetimi</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Sayfa Ekle
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Baslik</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Yayinda</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockPages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 text-muted">/{page.slug}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block h-2 w-2 rounded-full ${page.isPublished ? "bg-green-500" : "bg-gray-300"}`} />
                </td>
                <td className="px-4 py-3">
                  <button className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Duzenle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
