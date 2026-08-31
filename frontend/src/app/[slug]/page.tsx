import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  const res = await fetch(`${API}/pages/${slug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || json;
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return {
    title: page?.meta_title || page?.title || slug,
    description: page?.meta_description || undefined,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: page?.meta_title || page?.title || slug,
      description: page?.meta_description || undefined,
      type: "article",
      url: `/${slug}`,
    },
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-gray-500"><Link href="/">Ana Sayfa</Link><span className="mx-2">&gt;</span><span>{page.title}</span></nav>
      <article className="rounded-xl border bg-white p-6">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <div className="mt-6 whitespace-pre-wrap text-gray-700">{page.content || "Bu sayfa yakında güncellenecek."}</div>
      </article>
    </div>
  );
}
