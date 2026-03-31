import Link from "next/link";

const navLinks = [
  { name: "Hakkımızda", href: "/hakkimizda" },
  { name: "Markalar İçin", href: "/markalar-icin" },
  { name: "SSS", href: "/sss" },
  { name: "İletişim", href: "/iletisim" },
];

const columns = {
  memnuniyetler: {
    title: "Memnuniyetler",
    links: [
      { name: "Trendyol kargo sürecinden çok memnun kaldım", href: "/memnuniyet/1" },
      { name: "Getir siparişim dakikalar içinde geldi", href: "/memnuniyet/2" },
      { name: "THY müşteri hizmetleri sorunu hemen çözdü", href: "/memnuniyet/3" },
      { name: "Hepsiburada iade işlemim çok kolay oldu", href: "/memnuniyet/4" },
      { name: "A101 mağaza personeli çok ilgiliydi", href: "/memnuniyet/5" },
      { name: "Migros online market deneyimim harikaydı", href: "/memnuniyet/6" },
    ],
  },
  markalar: {
    title: "Markalar",
    links: [
      { name: "Trendyol", href: "/marka/trendyol" },
      { name: "Getir", href: "/marka/getir" },
      { name: "THY", href: "/marka/thy" },
      { name: "Hepsiburada", href: "/marka/hepsiburada" },
      { name: "A101", href: "/marka/a101" },
      { name: "Migros", href: "/marka/migros" },
      { name: "BİM", href: "/marka/bim" },
      { name: "Tüm Markalar →", href: "/markalar" },
    ],
  },
  cokArananlar: {
    title: "Çok Arananlar",
    links: [
      { name: "Kargo Takip", href: "/ara?q=kargo-takip" },
      { name: "İade", href: "/ara?q=iade" },
      { name: "Müşteri Hizmetleri", href: "/ara?q=musteri-hizmetleri" },
      { name: "Fatura", href: "/ara?q=fatura" },
      { name: "Garanti", href: "/ara?q=garanti" },
      { name: "Trendyol", href: "/ara?q=trendyol" },
      { name: "Tüm Aramalar →", href: "/ara" },
    ],
  },
  trend100: {
    title: "Trend100",
    links: [
      { name: "Turkcell", href: "/marka/turkcell" },
      { name: "Vodafone", href: "/marka/vodafone" },
      { name: "Türk Telekom", href: "/marka/turk-telekom" },
      { name: "Yemeksepeti", href: "/marka/yemeksepeti" },
      { name: "N11", href: "/marka/n11" },
      { name: "Sahibinden", href: "/marka/sahibinden" },
      { name: "LC Waikiki", href: "/marka/lc-waikiki" },
      { name: "Tüm Trend100 →", href: "/trend" },
    ],
  },
  konular: {
    title: "Konular",
    links: [
      { name: "İade", href: "/konu/iade" },
      { name: "Servis", href: "/konu/servis" },
      { name: "Müşteri Hizmetleri", href: "/konu/musteri-hizmetleri" },
      { name: "Ücret", href: "/konu/ucret" },
      { name: "Kargo", href: "/konu/kargo" },
      { name: "Teslimat", href: "/konu/teslimat" },
      { name: "Kalite", href: "/konu/kalite" },
      { name: "Tüm Konular →", href: "/konular" },
    ],
  },
};

const legalLinks = [
  { name: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { name: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
  { name: "KVKK", href: "/kvkk" },
];

function XIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <circle cx="16" cy="16" r="16" className="fill-green-800" />
      <path
        d="M18.2 14.7L22.5 10h-1l-3.7 4.1L14.6 10H10.5l4.5 6.3L10.5 21h1l3.9-4.4 3.2 4.4h4.1L18.2 14.7zm-1.4 1.5l-.5-.6-3.6-5h1.5l2.9 4 .5.6 3.8 5.2h-1.5l-3.1-4.2z"
        className="fill-green-300"
      />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <circle cx="16" cy="16" r="16" className="fill-green-800" />
      <path
        d="M23.5 12.8c-.2-.8-.8-1.4-1.6-1.6C20.6 11 16 11 16 11s-4.6 0-5.9.3c-.8.2-1.4.8-1.6 1.6C8.2 14 8.2 16 8.2 16s0 2 .3 3.2c.2.8.8 1.4 1.6 1.6 1.3.3 5.9.3 5.9.3s4.6 0 5.9-.3c.8-.2 1.4-.8 1.6-1.6.3-1.2.3-3.2.3-3.2s0-2-.3-3.2z"
        className="fill-green-300"
      />
      <polygon points="14.5,18.5 18.5,16 14.5,13.5" className="fill-green-800" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <circle cx="16" cy="16" r="16" className="fill-green-800" />
      <path
        d="M17.5 24v-7.5h2.5l.4-2.9h-2.9v-1.8c0-.8.2-1.4 1.4-1.4h1.5V8.1c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.2H12.3v2.9h2.5V24h2.7z"
        className="fill-green-300"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <circle cx="16" cy="16" r="16" className="fill-green-800" />
      <path
        d="M12.3 23h-2.7v-8.6h2.7V23zm-1.3-9.8c-.9 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM23.5 23h-2.7v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3.9-.1.2-.1.4-.1.6V23h-2.7s0-7.8 0-8.6h2.7v1.2c.4-.6 1-1.4 2.5-1.4 1.8 0 3.2 1.2 3.2 3.8V23h-.3z"
        className="fill-green-300"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#052e16] text-white mt-16">
      {/* Top Section: Logo + Nav + Social */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold font-[family-name:var(--font-display)] shrink-0"
            >
              <span className="text-green-400">Memnuniyetim</span>
              <span className="text-yellow-400">Var</span>
            </Link>

            {/* Nav + Social */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Main Nav */}
              <nav className="flex items-center gap-5">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm text-white/70 hover:text-yellow-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <Link href="https://x.com" aria-label="X" className="hover:opacity-80 transition-opacity">
                  <XIcon />
                </Link>
                <Link href="https://youtube.com" aria-label="YouTube" className="hover:opacity-80 transition-opacity">
                  <YouTubeIcon />
                </Link>
                <Link href="https://facebook.com" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                  <FacebookIcon />
                </Link>
                <Link href="https://linkedin.com" aria-label="LinkedIn" className="hover:opacity-80 transition-opacity">
                  <LinkedInIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: 5 Column Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Memnuniyetler */}
          <div>
            <h3 className="text-sm font-semibold text-[#eab308] uppercase tracking-wider mb-4">
              {columns.memnuniyetler.title}
            </h3>
            <ul className="space-y-2.5">
              {columns.memnuniyetler.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-yellow-300 transition-colors line-clamp-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Markalar */}
          <div>
            <h3 className="text-sm font-semibold text-[#eab308] uppercase tracking-wider mb-4">
              {columns.markalar.title}
            </h3>
            <ul className="space-y-2.5">
              {columns.markalar.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-yellow-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Çok Arananlar */}
          <div>
            <h3 className="text-sm font-semibold text-[#eab308] uppercase tracking-wider mb-4">
              {columns.cokArananlar.title}
            </h3>
            <ul className="space-y-2.5">
              {columns.cokArananlar.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-yellow-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trend100 */}
          <div>
            <h3 className="text-sm font-semibold text-[#eab308] uppercase tracking-wider mb-4">
              {columns.trend100.title}
            </h3>
            <ul className="space-y-2.5">
              {columns.trend100.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-yellow-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Konular */}
          <div>
            <h3 className="text-sm font-semibold text-[#eab308] uppercase tracking-wider mb-4">
              {columns.konular.title}
            </h3>
            <ul className="space-y-2.5">
              {columns.konular.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-yellow-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section: Copyright + Legal */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              &copy; 2026 MemnuniyetimVar &mdash; T&uuml;m hakları saklıdır.
            </p>
            <nav className="flex items-center gap-1 text-xs text-slate-500">
              {legalLinks.map((link, i) => (
                <span key={link.name} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-600">&middot;</span>}
                  <Link
                    href={link.href}
                    className="hover:text-yellow-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
