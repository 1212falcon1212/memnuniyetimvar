"use client";

import Link from "next/link";

export default function KategoriDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Kategori yüklenemedi</h2>
      <p className="mt-2 text-gray-600">{error.message || "Beklenmeyen bir hata oluştu."}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
          Tekrar Dene
        </button>
        <Link href="/kategori" className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Tüm Kategoriler
        </Link>
      </div>
    </div>
  );
}
