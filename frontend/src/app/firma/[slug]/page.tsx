import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Firma Detay`,
    description: `${slug} firması hakkında memnuniyet yorumları ve değerlendirmeler.`,
  };
}

export default async function FirmaDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div>
      {/* Company Header placeholder */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
            <span className="mx-2">&gt;</span>
            <Link href="/firma" className="hover:text-primary">Firmalar</Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900">{slug}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-gray-900">
            {slug}
          </h1>
          <p className="mt-2 text-gray-500">
            Firma detayları API entegrasyonuyla yüklenecek.
          </p>
        </div>
      </div>

      {/* Reviews section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-gray-900">Memnuniyet Yorumları</h2>
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
          Yorumlar API entegrasyonuyla yüklenecek
        </div>
      </div>
    </div>
  );
}
