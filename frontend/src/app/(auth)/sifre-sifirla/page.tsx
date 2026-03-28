"use client";

import Link from "next/link";
import { useState } from "react";

export default function SifreSifirlaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center text-gray-900">
          Şifre Sıfırlama
        </h1>

        {sent ? (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-sm text-emerald-700">
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
            </p>
            <Link href="/giris" className="mt-3 inline-block text-sm text-primary hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-gray-600">
              E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="ornek@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
              <p className="text-center text-sm">
                <Link href="/giris" className="text-primary hover:underline">
                  Giriş sayfasına dön
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
