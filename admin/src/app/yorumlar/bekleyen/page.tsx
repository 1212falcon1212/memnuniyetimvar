"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function BekleyenYorumlarPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Bekleyen Yorumlar</h1>
      <p className="mt-1 text-sm text-muted">Onay bekleyen yorumlari inceleyin</p>

      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card-bg p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Kullanici {i}</span>
                  <span className="text-muted">→</span>
                  <span className="font-medium text-primary">Firma {i}</span>
                  <StatusBadge status="pending" />
                </div>
                <div className="mt-1 text-amber-500">{"★".repeat(4 + (i % 2))}</div>
                <h3 className="mt-2 font-semibold">Harika bir deneyim yasadim #{i}</h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Onayla</button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reddet</button>
              <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-gray-50">One Cikar</button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
