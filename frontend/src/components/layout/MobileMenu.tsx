"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  navigation: { name: string; href: string }[];
}

export function MobileMenu({ open, onClose, navigation }: MobileMenuProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  if (!open) return null;

  function handleLogout() {
    logout();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-bold font-[family-name:var(--font-display)] text-primary">
            Memnuniyetim<span className="text-secondary">Var</span>
          </span>
          <button type="button" className="p-2 text-gray-600" onClick={onClose}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
            >
              {item.name}
            </Link>
          ))}

          <hr className="my-4" />

          {isLoading ? (
            <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ) : isAuthenticated ? (
            <>
              <Link
                href="/profil"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {user?.fullName || "Profilim"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link
                href="/giris"
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                onClick={onClose}
                className="block rounded-lg bg-primary px-3 py-2 text-center text-base font-semibold text-white hover:bg-primary-dark"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
