"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function RaporlarPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Rapor Yonetimi</h1>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Raporlayan</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Yorum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Sebep</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { reporter: "Ali V.", review: "Yorum #123", reason: "spam", status: "pending" },
              { reporter: "Zeynep A.", review: "Yorum #456", reason: "fake", status: "reviewed" },
            ].map((report, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{report.reporter}</td>
                <td className="px-4 py-3">{report.review}</td>
                <td className="px-4 py-3 capitalize">{report.reason}</td>
                <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                <td className="px-4 py-3">
                  {report.status === "pending" && (
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">Incele</button>
                      <button className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">Reddet</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
