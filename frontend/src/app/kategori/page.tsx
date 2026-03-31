import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "MemnuniyetimVar'da tüm firma kategorilerini keşfedin.",
};

const categories = [
  { name: "E-Ticaret", slug: "e-ticaret", banner: "/images/categories/e-ticaret.svg", children: ["Online Mağazalar", "Pazar Yerleri", "Abonelik Kutuları"] },
  { name: "Telekomünikasyon", slug: "telekomunikasyon", banner: "/images/categories/telekomunikasyon.svg", children: ["GSM Operatörleri", "İnternet Sağlayıcıları", "Kablo TV"] },
  { name: "Bankacılık & Finans", slug: "bankacilik-finans", banner: "/images/categories/banka.svg", children: ["Bankalar", "Sigorta", "Yatırım"] },
  { name: "Seyahat & Konaklama", slug: "seyahat-konaklama", banner: "/images/categories/seyahat.svg", children: ["Havayolları", "Oteller", "Tur Operatörleri"] },
  { name: "Yemek & İçecek", slug: "yemek-icecek", banner: "/images/categories/yemek.svg", children: ["Restoranlar", "Online Yemek Sipariş", "Kafe & Pastane"] },
  { name: "Otomotiv", slug: "otomotiv", banner: "/images/categories/otomotiv.svg", children: ["Otomobil Markaları", "Servisler", "Kiralama"] },
  { name: "Kargo & Lojistik", slug: "kargo-lojistik", banner: "/images/categories/kargo.svg", children: ["Kargo Firmaları", "Kurye", "Depolama"] },
  { name: "Sağlık", slug: "saglik", banner: "/images/categories/saglik.svg", children: ["Hastaneler", "Eczaneler", "Sigorta"] },
  { name: "Eğitim", slug: "egitim", banner: "/images/categories/egitim.svg", children: ["Online Eğitim", "Dil Kursları", "Üniversiteler"] },
  { name: "Teknoloji & Elektronik", slug: "teknoloji-elektronik", banner: "/images/categories/teknoloji.svg", children: ["Bilgisayar", "Telefon & Aksesuar", "Beyaz Eşya"] },
];

export default function KategoriListPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">Kategoriler</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
        Tüm Kategoriler
      </h1>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/kategori/${cat.slug}`}
            className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-primary hover:shadow-lg transition-all"
          >
            {/* Banner */}
            <div className="relative h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${cat.banner})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <h2 className="absolute bottom-3 left-4 text-lg font-bold text-white drop-shadow-md">
                {cat.name}
              </h2>
            </div>
            {/* Sub-categories */}
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {cat.children.map((child) => (
                  <span
                    key={child}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                  >
                    {child}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
