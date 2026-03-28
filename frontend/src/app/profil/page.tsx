"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  reviewCount: number;
  helpfulCount: number;
}

export default function ProfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/me")
      .then((res) => setUser(res.data.data))
      .catch(() => {
        window.location.href = "/giris";
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Profilim</h1>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-primary">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.fullName}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{user.reviewCount}</p>
            <p className="text-sm text-gray-500">Yorum</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">{user.helpfulCount}</p>
            <p className="text-sm text-gray-500">Faydali Oy</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Telefon</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{user.phone}</span>
              {user.isPhoneVerified ? (
                <span className="text-xs text-green-600">Dogrulandi</span>
              ) : (
                <span className="text-xs text-yellow-600">Dogrulanmadi</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">E-posta</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{user.email}</span>
              {user.isEmailVerified ? (
                <span className="text-xs text-green-600">Dogrulandi</span>
              ) : (
                <span className="text-xs text-yellow-600">Dogrulanmadi</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/memnuniyet/yaz"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Yeni Yorum Yaz
          </Link>
        </div>
      </div>
    </div>
  );
}
