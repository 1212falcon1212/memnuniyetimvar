"use client";

export default function EnIyiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Firmalar yüklenemedi</h2>
      <p className="mt-2 text-gray-600">{error.message || "Beklenmeyen bir hata oluştu."}</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
        Tekrar Dene
      </button>
    </div>
  );
}
