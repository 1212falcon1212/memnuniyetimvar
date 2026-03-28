"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { MobileMenu } from "./MobileMenu";

const navigation = [
  { name: "Memnuniyetler", href: "/memnuniyetler" },
  { name: "Trend 100", href: "/trend" },
];

const TARGET_COUNT = 4_292_307;
const ANIMATION_DURATION_MS = 2000;
const ANIMATION_STEPS = 60;

function useAnimatedCounter(target: number): string {
  const [current, setCurrent] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const stepDuration = ANIMATION_DURATION_MS / ANIMATION_STEPS;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / ANIMATION_STEPS;
      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (step >= ANIMATION_STEPS) {
        clearInterval(interval);
        setCurrent(target);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [target]);

  return current.toLocaleString("tr-TR");
}

function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
    </span>
  );
}

function AnnouncementBar() {
  const formattedCount = useAnimatedCounter(TARGET_COUNT);

  return (
    <div className="hidden md:block bg-[#052e16] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Left: total gratitude count */}
          <div className="flex items-center gap-2 text-xs text-green-200">
            <span>Toplam teşekkür sayısı</span>
            <span className="text-base font-bold text-[#166534] tabular-nums tracking-tight">
              {formattedCount}
            </span>
          </div>

          {/* Right: live tracking CTA */}
          <div className="flex items-center gap-3 text-xs text-green-200">
            <span>Memnuniyetleri canlı olarak takip et</span>
            <Link
              href="/canli"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#166534]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#166534] transition-colors hover:bg-[#166534]/25"
            >
              <LivePulse />
              Canlı
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold font-display tracking-tight">
                <span className="text-[#166534]">Memnuniyetim</span>
                <span className="text-[#eab308]">Var</span>
              </span>
            </Link>

            {/* Center: Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-gray-50 hover:text-[#166534]"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            {/* Right: Auth + CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/giris"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-[#166534] whitespace-nowrap"
              >
                Giriş Yap / Üye Ol
              </Link>
              <Link
                href="/memnuniyet-yaz"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#166534]-dark hover:shadow-md active:scale-[0.98] whitespace-nowrap"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Memnuniyetini Yaz
              </Link>
            </div>

            {/* Mobile: Hamburger */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-foreground/70 transition-colors hover:bg-gray-100 hover:text-foreground"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menüyü aç"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>

          {/* Mobile: Search below header */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>
        </nav>

        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          navigation={navigation}
        />
      </header>
    </>
  );
}
