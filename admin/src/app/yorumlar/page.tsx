"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";

const tabs = ["Tumu", "Bekleyen", "Onaylanan", "Reddedilen"];

const mockReviews = [
  { id: "1", user: "Ahmet Y.", company: "Trendyol", rating: 5, status: "pending", date: "2 saat once" },
  { id: "2", user: "Elif K.", company: "Getir", rating: 4, status: "published", date: "5 saat once" },
  { id: "3", user: "Can M.", company: "THY", rating: 3, status: "rejected", date: "1 gun once" },
];

export default function YorumlarPage() {
  const [activeTab, setActiveTab] = useState("Tumu");

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Yorum Yonetimi</h1>
      </div>

      <div className="mt-4 flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Kullanici</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Firma</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Puan</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Tarih</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockReviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{review.user}</td>
                <td className="px-4 py-3">{review.company}</td>
                <td className="px-4 py-3 text-amber-500">{"★".repeat(review.rating)}</td>
                <td className="px-4 py-3"><StatusBadge status={review.status} /></td>
                <td className="px-4 py-3 text-muted">{review.date}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {review.status === "pending" && (
                      <>
                        <button className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">Onayla</button>
                        <button className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Reddet</button>
                      </>
                    )}
                    <button className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Detay</button>
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
