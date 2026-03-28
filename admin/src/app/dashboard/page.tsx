"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";

const stats = [
  { label: "Bugun Yorum", value: "156", color: "bg-blue-50 text-blue-700" },
  { label: "Bekleyen", value: "23", color: "bg-yellow-50 text-yellow-700" },
  { label: "Toplam Uye", value: "4.2K", color: "bg-green-50 text-green-700" },
  { label: "Yanit Orani", value: "%89", color: "bg-purple-50 text-purple-700" },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card-bg p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color} inline-block rounded-lg px-2 py-0.5`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="text-lg font-semibold">Son Bekleyen Yorumlar</h2>
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">Kullanici {i} → Firma {i}</p>
                  <p className="text-xs text-muted">2 saat once</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
                    Onayla
                  </button>
                  <button className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card-bg p-5">
          <h2 className="text-lg font-semibold">Son Aktiviteler</h2>
          <div className="mt-4 space-y-3">
            {["Yorum #1234 onaylandi", "Firma 'Trendyol' eklendi", "Kullanici #567 engellendi"].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
