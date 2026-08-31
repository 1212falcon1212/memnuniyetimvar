"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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

interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export default function ProfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyBanner, setVerifyBanner] = useState(false);
  const [sendingVerify, setSendingVerify] = useState<"phone" | "email" | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verify") === "1") {
      setVerifyBanner(true);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([api.get("/users/me"), api.get("/users/me/notifications")])
      .then(([profileRes, notificationsRes]) => {
        const res = profileRes;
        const data = res.data.data || res.data;
        setUser({
          id: data.id,
          fullName: data.fullName || data.full_name || "Kullanıcı",
          email: data.email,
          phone: data.phone,
          avatarUrl: data.avatarUrl || data.avatar_url || null,
          isPhoneVerified: data.isPhoneVerified ?? data.is_phone_verified ?? false,
          isEmailVerified: data.isEmailVerified ?? data.is_email_verified ?? false,
          reviewCount: data.reviewCount ?? data.review_count ?? 0,
          helpfulCount: data.helpfulCount ?? data.helpful_count ?? 0,
        });
        const notificationPayload = notificationsRes.data.data || notificationsRes.data;
        setNotifications(Array.isArray(notificationPayload) ? notificationPayload : notificationPayload.data || []);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function resendVerification(type: "phone" | "email") {
    setSendingVerify(type);
    setVerifyMessage((prev) => ({ ...prev, [type]: "" }));
    try {
      const endpoint = type === "phone" ? "/auth/resend-phone-verification" : "/auth/resend-email-verification";
      await api.post(endpoint);
      setVerifyMessage((prev) => ({ ...prev, [type]: "Doğrulama kodu gönderildi." }));
    } catch {
      setVerifyMessage((prev) => ({ ...prev, [type]: "Gönderilemedi. Lütfen tekrar deneyin." }));
    } finally {
      setSendingVerify(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900">Profil yüklenemedi</h2>
        <p className="mt-2 text-gray-500">Lütfen giriş yapın.</p>
        <Link href="/giris" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
          Giriş Yap
        </Link>
      </div>
    );
  }

  const displayName = user.fullName || "Kullanıcı";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Profilim</h1>

      {verifyBanner && (user?.isPhoneVerified || user?.isEmailVerified) && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Hesabınızı doğrulamak için telefon ve e-posta onayınızı tamamlayın. Doğrulanmamış hesaplar bazı özelliklere erişemez.
          </p>
          <button onClick={() => setVerifyBanner(false)} className="mt-2 text-xs text-amber-600 hover:underline">
            Kapat
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              <Image src={user.avatarUrl} alt={displayName} fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-primary">
              {displayName?.charAt(0).toUpperCase() || "K"}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
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
                  <span className="text-xs text-green-600">Doğrulandı</span>
                ) : (
                  <>
                    <span className="text-xs text-yellow-600">Doğrulanmadı</span>
                    <button
                      onClick={() => resendVerification("phone")}
                      disabled={sendingVerify === "phone"}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      {sendingVerify === "phone" ? "Gönderiliyor..." : "Doğrula"}
                    </button>
                    {verifyMessage.phone && <span className="text-xs text-green-600">{verifyMessage.phone}</span>}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">E-posta</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.email}</span>
                {user.isEmailVerified ? (
                  <span className="text-xs text-green-600">Doğrulandı</span>
                ) : (
                  <>
                    <span className="text-xs text-yellow-600">Doğrulanmadı</span>
                    <button
                      onClick={() => resendVerification("email")}
                      disabled={sendingVerify === "email"}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      {sendingVerify === "email" ? "Gönderiliyor..." : "Doğrula"}
                    </button>
                    {verifyMessage.email && <span className="text-xs text-green-600">{verifyMessage.email}</span>}
                  </>
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

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Bildirimler</h2>
        <div className="mt-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">Henüz bildiriminiz yok.</p>
          ) : notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-gray-900">{notification.title}</p>
                {!notification.is_read && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-primary">Yeni</span>}
              </div>
              {notification.message && <p className="mt-1 text-sm text-gray-600">{notification.message}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
