"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";

const mockCompanies = [
  { id: "1", name: "Trendyol", category: "E-Ticaret", rating: 4.7, reviewCount: 12543, status: "active" },
  { id: "2", name: "Getir", category: "Yemek & Icecek", rating: 4.2, reviewCount: 8910, status: "active" },
  { id: "3", name: "Yeni Firma", category: "Teknoloji", rating: 0, reviewCount: 0, status: "pending" },
];

export default function FirmalarPage() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Firma Yonetimi</h1>
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
              <th className="px-4 py-3 text-left font-medium text-muted">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockCompanies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{company.name}</td>
                <td className="px-4 py-3 text-muted">{company.category}</td>
                <td className="px-4 py-3">
                  <span className="text-amber-500">★</span> {company.rating.toFixed(1)}
                </td>
                <td className="px-4 py-3">{company.reviewCount.toLocaleString("tr-TR")}</td>
                <td className="px-4 py-3"><StatusBadge status={company.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Duzenle</button>
                    <button className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
