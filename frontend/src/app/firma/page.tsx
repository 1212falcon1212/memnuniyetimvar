import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Firmalar",
  description: "MemnuniyetimVar'da kayıtlı tüm firmaları keşfedin, değerlendirmeleri okuyun.",
};

export default function FirmaListPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Firmalar</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Tüm Firmalar
      </h1>
      <p className="mt-2 text-gray-600">
        Firmaları keşfedin, memnuniyet yorumlarını okuyun.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none">
          <option value="">Tüm Şehirler</option>
          <option value="istanbul">İstanbul</option>
          <option value="ankara">Ankara</option>
          <option value="izmir">İzmir</option>
        </select>
        <select className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none">
          <option value="">Tüm Kategoriler</option>
          <option value="e-ticaret">E-Ticaret</option>
          <option value="telekomunikasyon">Telekomünikasyon</option>
        </select>
        <select className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none">
          <option value="rating">En Yüksek Puan</option>
          <option value="reviews">En Çok Yorum</option>
          <option value="name">İsim (A-Z)</option>
        </select>
      </div>

      {/* Company list placeholder */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
          Firma verileri API entegrasyonuyla yüklenecek
        </div>
      </div>
    </div>
  );
}
