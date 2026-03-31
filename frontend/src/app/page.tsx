import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  API Fetch Helpers                                                   */
/* ------------------------------------------------------------------ */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function fetchAPI(endpoint: string) {
  try {
    const res = await fetch(`${API}${endpoint}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch { return null; }
}

const AVATAR_COLORS = ["#166534", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#e11d48", "#0d9488"];

const CATEGORY_BANNERS: Record<string, string> = {
  "e-ticaret": "/images/categories/e-ticaret.svg",
  "telekomunikasyon": "/images/categories/telekomunikasyon.svg",
  "seyahat-konaklama": "/images/categories/seyahat.svg",
  "bankacilik-finans": "/images/categories/banka.svg",
  "otomotiv": "/images/categories/otomotiv.svg",
  "yemek-icecek": "/images/categories/yemek.svg",
  "saglik": "/images/categories/saglik.svg",
  "kargo-lojistik": "/images/categories/kargo.svg",
};

const platformStats = [
  {
    label: "Bireysel Üye Sayısı",
    value: "14.262.584",
    color: "#166534",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Kayıtlı Marka",
    value: "263.252",
    color: "#3b82f6",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    label: "Paylaşılan Memnuniyet",
    value: "4.277.962",
    color: "#8b5cf6",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h.01" />
        <path d="M12 10h.01" />
        <path d="M16 10h.01" />
      </svg>
    ),
  },
  {
    label: "Son 30 Günde Ziyaretçi",
    value: "19.530.721",
    color: "#06b6d4",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  // Fetch real data from API
  const [latestReviews, topCompaniesData, trendingData, categoriesData] = await Promise.all([
    fetchAPI("/reviews/latest?limit=6"),
    fetchAPI("/companies/top?limit=5"),
    fetchAPI("/companies/trending?limit=5"),
    fetchAPI("/categories/popular"),
  ]);

  // Map API data to component format
  const gundemReviews = (Array.isArray(latestReviews) ? latestReviews : []).map((r: any, i: number) => ({
    id: r.id,
    userName: r.user?.full_name || r.userName || "Kullanıcı",
    userInitial: (r.user?.full_name || "K")[0].toUpperCase(),
    userColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    companyName: r.company?.name || "Firma",
    companySlug: r.company?.slug || "#",
    title: r.title,
    views: r.viewCount || r.view_count || 0,
  }));

  const topCompanies = (Array.isArray(topCompaniesData) ? topCompaniesData : []).map((c: any, i: number) => ({
    rank: i + 1,
    name: c.name,
    slug: c.slug,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    score: Math.round(Number(c.memnuniyetScore) || 0),
    change: Math.floor(Math.random() * 5),
    direction: (["up", "up", "same", "down", "up"] as const)[i],
    verified: c.isVerified,
  }));

  const trendCompanies = (Array.isArray(trendingData) ? trendingData : []).map((c: any, i: number) => ({
    name: c.name,
    slug: c.slug,
    category: c.category?.name || "",
    growth: Math.floor(500 + Math.random() * 2500),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    sparkline: ["0,30 15,28 30,25 45,22 55,18 65,20 75,12 85,8 100,3", "0,32 15,30 30,28 45,26 55,22 65,18 75,15 85,10 100,5", "0,28 15,30 30,26 45,24 55,20 65,22 75,14 85,10 100,6", "0,34 15,32 30,30 45,26 55,28 65,22 75,18 85,12 100,8", "0,30 15,28 30,32 45,24 55,20 65,18 75,16 85,14 100,10"][i % 5],
  }));

  const categories = (Array.isArray(categoriesData) ? categoriesData : []).slice(0, 8).map((c: any) => ({
    name: c.name,
    count: c.reviewCount > 1000 ? `${(c.reviewCount / 1000).toFixed(1)}K` : String(c.reviewCount || 0),
    slug: c.slug,
    banner: CATEGORY_BANNERS[c.slug] || "/images/categories/e-ticaret.svg",
  }));
  return (
    <>
      {/* ============================================================ */}
      {/* A) Hero Section                                               */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left: Content */}
            <div className="animate-fade-up">
              <h1 className="text-4xl font-[family-name:var(--font-display)] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Teşekkür için
                <br />
                <span className="text-[#166534]">MemnuniyetimVar</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted">
                Memnun kaldığınız firmaları arayın, deneyimlerinizi paylaşın.
                Türkiye&apos;nin en büyük pozitif müşteri deneyimi platformu.
              </p>

              {/* Search Bar */}
              <div className="mt-8 max-w-xl animate-fade-up animation-delay-200">
                <form action="/arama" className="flex">
                  <div className="relative flex-1">
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                      name="q"
                      type="text"
                      placeholder="Firma veya marka adı yazın..."
                      className="w-full rounded-l-xl border border-r-0 border-border bg-white py-4 pl-12 pr-4 text-base placeholder:text-gray-400 focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-r-xl bg-[#166534] px-8 text-base font-semibold text-white transition-colors hover:bg-[#166534]-dark"
                  >
                    Ara
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative hidden lg:block animate-fade-in animation-delay-300">
              <div className="relative">
                {/* Decorative background shapes */}
                <div className="absolute -top-6 -right-6 h-72 w-72 rounded-full bg-green-100/60" />
                <div className="absolute -bottom-4 -left-4 h-48 w-48 rounded-full bg-amber-100/50" />
                <div className="absolute top-1/2 right-0 h-20 w-20 rounded-full bg-green-200/40" />

                {/* Main image */}
                <img
                  src="/images/hero-person.png"
                  alt="Memnun müşteri"
                  className="relative z-10 mx-auto w-full max-w-[520px] rounded-2xl object-cover"
                />

                {/* Floating badge - top right */}
                <div className="absolute -right-2 top-8 z-20 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg ring-1 ring-black/5 animate-fade-up animation-delay-400">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm">✅</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">4.2M+</p>
                    <p className="text-[10px] text-muted">Mutlu Müşteri</p>
                  </div>
                </div>

                {/* Floating badge - bottom left */}
                <div className="absolute -left-4 bottom-16 z-20 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg ring-1 ring-black/5 animate-fade-up animation-delay-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm">⭐</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">4.8 / 5</p>
                    <p className="text-[10px] text-muted">Ortalama Puan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* B) Gündemdeki Memnuniyetler                                   */}
      {/* ============================================================ */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-[family-name:var(--font-display)] text-gray-400 sm:text-3xl">
            Gündemdeki Memnuniyetler
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gundemReviews.map((review) => (
              <Link
                key={review.id}
                href={`/firma/${review.companySlug}`}
                className="group rounded-xl border border-border bg-white p-5 transition-all hover:shadow-md"
              >
                {/* Top row: user + company + views */}
                <div className="mb-3 flex items-center gap-2 text-sm">
                  {/* User avatar */}
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: review.userColor }}
                  >
                    {review.userInitial}
                  </div>
                  <span className="font-semibold text-gray-900">{review.userName}</span>

                  {/* Arrow */}
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>

                  {/* Company name */}
                  <span className="font-medium text-[#166534] group-hover:underline">{review.companyName}</span>

                  {/* Spacer */}
                  <span className="flex-1" />

                  {/* Eye icon + view count */}
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    {review.views.toLocaleString("tr-TR")}
                  </span>
                </div>

                {/* Review title */}
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
                  {review.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* C) Popüler Kategoriler                                        */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
            Popüler Kategoriler
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/kategori/${cat.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-white transition-all hover:border-[#166534] hover:shadow-lg"
              >
                {/* Banner Image */}
                <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 sm:h-36">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cat.banner})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                {/* Text Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="text-sm font-bold text-white drop-shadow-md sm:text-base">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-white/80">{cat.count} firma</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* D) En Çok Teşekkür Edilen                                     */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-16" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #dbeafe 50%, #e0f2fe 100%)" }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-[family-name:var(--font-display)] text-gray-900 sm:text-3xl">
              En Çok Teşekkür Edilen
            </h2>

            {/* Controls row */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <select className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-gray-700 focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20">
                <option>Tüm Kategoriler</option>
                <option>E-Ticaret</option>
                <option>Telekomünikasyon</option>
                <option>Seyahat</option>
                <option>Banka</option>
              </select>
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#166534]" />
                Son 1 Yıl
              </span>
            </div>

            <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
              MemnuniyetEndeks skoru; kullanıcı teşekkürleri, memnuniyet oranı ve çözüm kalitesine göre hesaplanır.
            </p>
          </div>

          {/* Ranked List */}
          <div className="space-y-3">
            {topCompanies.map((company) => {
              const borderColor =
                company.direction === "up"
                  ? "border-l-emerald-500"
                  : company.direction === "down"
                    ? "border-l-red-500"
                    : "border-l-gray-300";

              return (
                <Link
                  key={company.slug}
                  href={`/firma/${company.slug}`}
                  className={`group flex items-center gap-4 rounded-xl border border-border border-l-4 ${borderColor} bg-white p-4 transition-all hover:shadow-md sm:p-5`}
                >
                  {/* Direction indicator */}
                  <div className="flex w-8 flex-shrink-0 flex-col items-center text-xs font-semibold">
                    {company.direction === "up" && (
                      <span className="flex items-center gap-0.5 text-emerald-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                        </svg>
                        {company.change}
                      </span>
                    )}
                    {company.direction === "down" && (
                      <span className="flex items-center gap-0.5 text-red-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                        </svg>
                        {company.change}
                      </span>
                    )}
                    {company.direction === "same" && (
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </div>

                  {/* Rank */}
                  <span className="w-8 flex-shrink-0 text-lg font-bold text-gray-300">
                    {company.rank}.
                  </span>

                  {/* Logo placeholder */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
                    style={{ backgroundColor: company.color }}
                  >
                    {company.name.charAt(0)}
                  </div>

                  {/* Company name */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-semibold text-gray-900 group-hover:text-[#166534]">
                      {company.name}
                    </span>
                    {company.verified && (
                      <svg className="h-4 w-4 flex-shrink-0 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold text-gray-900">
                      {company.score}
                      <span className="font-normal text-muted">/100</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* E) Trend Firmalar                                             */}
      {/* ============================================================ */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-900">
              Trend Firmalar
            </h2>
            <p className="mt-2 text-muted">
              Artan memnuniyet oranları ve popülerlikleriyle bugün trend olan markaları takip edin!
            </p>
          </div>

          {/* Table Header */}
          <div className="hidden grid-cols-12 px-6 py-3 text-sm font-medium text-gray-400 sm:grid">
            <div className="col-span-1" />
            <div className="col-span-5">Marka</div>
            <div className="col-span-3 text-center">Trend</div>
            <div className="col-span-3 text-right">Memnuniyet Artışı</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 rounded-2xl border border-border bg-gray-50/50">
            {trendCompanies.map((company, index) => (
              <Link
                key={company.slug}
                href={`/firma/${company.slug}`}
                className="group grid grid-cols-12 items-center gap-4 px-6 py-5 transition-colors hover:bg-white"
              >
                {/* Rank */}
                <div className="col-span-1 text-lg font-bold text-gray-300">
                  {index + 1}.
                </div>

                {/* Company Info */}
                <div className="col-span-6 flex items-center gap-4 sm:col-span-5">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-white text-lg font-bold"
                    style={{ color: company.color }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 transition-colors group-hover:text-[#166534]">
                      {company.name}
                    </p>
                    <p className="text-xs text-gray-400">{company.category}</p>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="col-span-3 hidden justify-center sm:flex">
                  <svg width="100" height="36" viewBox="0 0 100 36" className="text-[#166534]">
                    <defs>
                      <linearGradient id={`sparkFill-${company.slug}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#166534" />
                        <stop offset="100%" stopColor="#166534" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={company.sparkline}
                    />
                    <polyline
                      fill={`url(#sparkFill-${company.slug})`}
                      stroke="none"
                      points={`0,36 ${company.sparkline} 100,36`}
                      opacity="0.15"
                    />
                  </svg>
                </div>

                {/* Growth */}
                <div className="col-span-5 text-right sm:col-span-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                    </svg>
                    %{company.growth}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/trend"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Tüm Trend Firmaları Gör
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* F) Sayılarla MemnuniyetimVar                                  */}
      {/* ============================================================ */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-[family-name:var(--font-display)] text-gray-900 sm:text-3xl">
            Sayılarla MemnuniyetimVar
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-xl border border-border bg-white px-6 py-8 text-center"
              >
                {/* Icon */}
                <div className="mb-4">{stat.icon}</div>
                {/* Label */}
                <p className="mb-2 text-sm text-muted">{stat.label}</p>
                {/* Value */}
                <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* G) CTA Section                                                */}
      {/* ============================================================ */}
      <section
        className="py-12 sm:py-16"
        style={{ background: "linear-gradient(135deg, #166534 0%, #059669 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-[family-name:var(--font-display)] text-white sm:text-3xl">
            Memnuniyetinizi paylaşın!
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-green-100">
            Güzel deneyimlerinizi yazın, firmaları teşekkürle ödüllendirin,
            diğer kullanıcılara yol gösterin.
          </p>
          <Link
            href="/memnuniyet/yaz"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-[#166534] transition-colors hover:bg-gray-50"
          >
            Hemen Yaz
          </Link>
        </div>
      </section>
    </>
  );
}
