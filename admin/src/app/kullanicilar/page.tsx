"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";

const mockUsers = [
  { id: "1", name: "Ahmet Yilmaz", email: "ahmet@example.com", reviewCount: 24, status: "active" },
  { id: "2", name: "Elif Kaya", email: "elif@example.com", reviewCount: 12, status: "active" },
  { id: "3", name: "Can Mutlu", email: "can@example.com", reviewCount: 0, status: "banned" },
];

export default function KullanicilarPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Kullanici Yonetimi</h1>

      <div className="mt-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Ad Soyad</th>
              <th className="px-4 py-3 text-left font-medium text-muted">E-posta</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Yorum Sayisi</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted">{user.email}</td>
                <td className="px-4 py-3">{user.reviewCount}</td>
                <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                <td className="px-4 py-3">
                  {user.status === "active" ? (
                    <button className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Engelle</button>
                  ) : (
                    <button className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">Engeli Kaldir</button>
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
