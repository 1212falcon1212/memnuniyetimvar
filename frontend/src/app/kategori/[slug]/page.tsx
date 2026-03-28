import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} Kategorisi`,
    description: `${slug} kategorisindeki en iyi firmaları keşfedin.`,
  };
}

export default async function KategoriDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/kategori" className="hover:text-primary">Kategoriler</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900">{slug}</span>
      </nav>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900 capitalize">
        {slug.replace(/-/g, " ")}
      </h1>
      <p className="mt-2 text-gray-600">
        Bu kategorideki firmaları keşfedin.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400">
          Firma verileri API entegrasyonuyla yüklenecek
        </div>
      </div>
    </div>
  );
}
