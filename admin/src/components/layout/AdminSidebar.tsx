"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Yorumlar", href: "/yorumlar", icon: "💬", children: [
    { name: "Bekleyen", href: "/yorumlar/bekleyen" },
  ]},
  { name: "Firmalar", href: "/firmalar", icon: "🏢", children: [
    { name: "Sahiplenme", href: "/firmalar/sahiplenme" },
  ]},
  { name: "Kullanıcılar", href: "/kullanicilar", icon: "👥" },
  { name: "Kategoriler", href: "/kategoriler", icon: "📁" },
  { name: "Raporlar", href: "/raporlar", icon: "🚩" },
  { name: "Sayfalar", href: "/sayfalar", icon: "📄" },
];

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-sidebar-text transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <span className="text-lg font-bold text-white">MemnuniyetimVar</span>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-text hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-1.5 pl-11 text-sm transition-colors ${
                    isActive(child.href)
                      ? "text-white font-medium"
                      : "text-sidebar-text/70 hover:text-white"
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
