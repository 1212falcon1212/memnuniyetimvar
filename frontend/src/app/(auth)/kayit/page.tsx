"use client";

import Link from "next/link";
import { useState } from "react";

export default function KayitPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const fe: Record<string, string> = {};
    if (!form.fullName.trim()) fe.fullName = "Ad Soyad gereklidir.";
    if (!form.email.trim()) fe.email = "E-posta gereklidir.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) fe.email = "Geçerli bir e-posta girin.";
    if (!form.phone.trim()) fe.phone = "Telefon gereklidir.";
    else if (form.phone.replace(/\D/g, "").length < 10) fe.phone = "Geçerli bir telefon girin.";
    if (!form.password) fe.password = "Şifre gereklidir.";
    else if (form.password.length < 8) fe.password = "Şifre en az 8 karakter olmalıdır.";
    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return; }

    setLoading(true);
    setError("");

    try {
      // Telefon numarasını +90 formatına çevir
      let phone = form.phone.replace(/\s/g, "");
      if (phone.startsWith("0")) phone = "+90" + phone.slice(1);
      if (!phone.startsWith("+90")) phone = "+90" + phone;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, phone }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Kayıt başarısız");
        return;
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      window.location.href = "/profil?verify=1";
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
          Kayıt Ol
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-medium text-primary hover:underline">
            Giriş Yap
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Ad Soyad
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange}
              className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.fullName ? "border-red-400" : "border-gray-300"}`}
              placeholder="Ahmet Yılmaz"
            />
            {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
              placeholder="ornek@email.com"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefon
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleChange}
              className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.phone ? "border-red-400" : "border-gray-300"}`}
              placeholder="+905551234567"
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
              placeholder="En az 8 karakter"
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Kayıt olarak{" "}
            <Link href="/kullanim-kosullari" className="text-primary hover:underline">
              Kullanım Koşullarını
            </Link>{" "}
            ve{" "}
            <Link href="/kvkk" className="text-primary hover:underline">
              KVKK Aydınlatma Metnini
            </Link>{" "}
            kabul etmiş olursunuz.
          </p>
        </form>
      </div>
    </div>
  );
}
