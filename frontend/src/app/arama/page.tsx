import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Arama Sonuçları",
  description: "MemnuniyetimVar'da firma ve yorum arama sonuçları.",
};

export default function AramaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Arama Sonuçları</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Arama Sonuçları
      </h1>

      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
        Arama sonuçları API entegrasyonuyla yüklenecek
      </div>
    </div>
  );
}
