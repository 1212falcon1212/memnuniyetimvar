"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReviewForm } from "@/components/review/ReviewForm";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function YorumYazPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: {
    companyId: string;
    title: string;
    content: string;
    rating: number;
    tagIds: number[];
    images: File[];
  }) {
    setError(null);
    setLoading(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      if (!token) {
        setError("Yorum yazmak icin giris yapmaniz gerekmektedir.");
        setLoading(false);
        return;
      }

      const body: Record<string, unknown> = {
        companyId: data.companyId,
        title: data.title,
        content: data.content,
        rating: data.rating,
      };
      if (data.tagIds.length > 0) body.tagIds = data.tagIds;

      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message || "Yorum gonderilirken bir hata olustu.";
        setError(message);
        setLoading(false);
        return;
      }

      const result = await response.json();
      const slug = result.data?.slug;

      if (data.images.length > 0 && slug) {
        const formData = new FormData();
        data.images.forEach((file) => {
          formData.append("images", file);
        });

        await fetch(`${API_BASE}/reviews/${slug}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }).catch(() => {
          // Image upload failure is non-critical; review is already saved
        });
      }

      router.push(slug ? `/memnuniyet/${slug}` : "/");
    } catch {
      setError("Bir hata olustu. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-gray-900">
            Giris Yapmaniz Gerekiyor
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Memnuniyet yorumu yazmak icin hesabiniza giris yapin.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/giris"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Giris Yap
            </Link>
            <Link
              href="/kayit"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              Hesap Olustur
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Ana Sayfa
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Yorum Yaz</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-gray-900">
          Memnuniyet Yorumu Yaz
        </h1>
        <p className="mt-2 text-gray-500">
          Memnun kaldiginiz firmayi degerlendirin ve deneyiminizi paylasin.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <ReviewForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </div>
  );
}
