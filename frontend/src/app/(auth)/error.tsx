"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900">Bir hata oluştu</h2>
        <p className="mt-2 text-gray-600">
          {error.message || "Beklenmeyen bir hata oluştu."}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
