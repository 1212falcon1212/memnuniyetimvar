import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yorum Daveti",
  robots: { index: false, follow: false },
};

interface InvitationInfo {
  token: string;
  companyId: string;
  companyName: string | null;
  companySlug: string | null;
  campaignName: string | null;
  expiresAt: string;
  valid: boolean;
}

async function validateInvitation(token: string): Promise<InvitationInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  try {
    const res = await fetch(`${apiUrl}/advertising/invitations/token/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export default async function DavetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await validateInvitation(token);

  if (!invitation || !invitation.valid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Davet geçersiz</h1>
        <p className="mt-3 text-gray-600">
          Bu davet bağlantısı geçersiz, süresi dolmuş veya daha önce kullanılmış olabilir.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-white"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const reviewHref = `/memnuniyet/yaz?firma=${invitation.companySlug ?? ""}&davet=${invitation.token}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
        ✔ Doğrulanmış Müşteri Daveti
      </span>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {invitation.companyName ?? "Firma"} sizi yorum yazmaya davet ediyor
      </h1>
      {invitation.campaignName && (
        <p className="mt-2 text-sm text-gray-500">Kampanya: {invitation.campaignName}</p>
      )}
      <p className="mt-3 text-gray-600">
        Bu davet bağlantısıyla yazacağınız yorum, şeffaflık için{" "}
        <span className="font-medium text-blue-700">&quot;Firma davetiyle yazıldı&quot;</span>{" "}
        etiketiyle gösterilir. Görüşleriniz tamamen size aittir; olumlu ya da olumsuz
        yazma hakkınız saklıdır.
      </p>
      <Link
        href={reviewHref}
        className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-medium text-white hover:opacity-90"
      >
        Memnuniyetimi Yaz
      </Link>
      <p className="mt-4 text-xs text-gray-400">
        <Link href="/seffaflik" className="hover:underline">
          Şeffaflık politikamızı okuyun
        </Link>
      </p>
    </div>
  );
}
