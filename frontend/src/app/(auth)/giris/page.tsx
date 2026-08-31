"use client";

import Link from "next/link";
import { useState } from "react";

export default function GirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const fe: Record<string, string> = {};
    if (!email.trim()) fe.email = "E-posta gereklidir.";
    else if (!/\S+@\S+\.\S+/.test(email)) fe.email = "Geçerli bir e-posta girin.";
    if (!password) fe.password = "Şifre gereklidir.";
    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Giriş başarısız");
        return;
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      window.location.href = "/";
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center text-gray-900">
          Giriş Yap
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="font-medium text-primary hover:underline">
            Kayıt Ol
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

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
              className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              placeholder="ornek@email.com"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
              placeholder="••••••••"
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <div className="flex items-center justify-end">
            <Link href="/sifre-sifirla" className="text-sm text-primary hover:underline">
              Şifremi Unuttum
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
