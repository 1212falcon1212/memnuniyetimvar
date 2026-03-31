"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function SahiplenmePage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Firma Sahiplenme Talepleri</h1>

      <div className="mt-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card-bg p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Firma {i} icin sahiplenme talebi</h3>
                <p className="mt-1 text-sm text-muted">Talep eden: Isletme Sahibi {i} — isletme{i}@example.com</p>
                <p className="mt-1 text-sm text-muted">Belge: vergi_levhasi_{i}.pdf</p>
                <StatusBadge status="pending" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Onayla</button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reddet</button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
