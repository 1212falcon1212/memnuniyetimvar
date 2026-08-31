import type { Metadata } from "next";
import Link from "next/link";
import { SponsoredBadge, VerifiedCustomerBadge } from "@/components/common/Badges";

export const metadata: Metadata = {
  title: "Şeffaflık Politikası",
  description:
    "MemnuniyetimVar'da sponsorlu içerikler ve doğrulanmış müşteri yorumları nasıl işaretlenir? Reklam ve doğrulama kriterlerimizi okuyun.",
  alternates: { canonical: "/seffaflik" },
};

export default function SeffaflikPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Şeffaflık Politikası</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">Şeffaflık Politikası</h1>
      <p className="mt-4 text-gray-600">
        MemnuniyetimVar, kullanıcı güvenini her şeyin önünde tutar. Platformda yer alan
        sponsorlu içerikleri ve firma davetiyle yazılan yorumları her zaman açıkça işaretliyoruz.
        Sahte yorum üretimi, gerçek kullanıcı gibi davranma veya reklamı organik içerik gibi
        gösterme gibi uygulamalara kesinlikle izin vermiyoruz.
      </p>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <SponsoredBadge />
          <h2 className="text-lg font-semibold text-gray-900">Sponsorlu İçerikler</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 list-disc pl-5">
          <li>
            Firmalar; sponsorlu vitrin, öne çıkan kampanya veya kategori sponsorluğu paketleri
            satın alarak görünürlüklerini artırabilir.
          </li>
          <li>
            Sponsorlu olarak öne çıkarılan her firma, listelerde ve firma sayfasında{" "}
            <span className="font-medium text-amber-700">&quot;Sponsorlu&quot;</span> etiketiyle gösterilir.
          </li>
          <li>
            Sponsorluk; bir firmanın puanını, yorumlarını veya MemnuniyetEndeks skorunu
            <strong> değiştirmez</strong>. Yalnızca yerleşimi etkiler.
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <VerifiedCustomerBadge />
          <h2 className="text-lg font-semibold text-gray-900">Doğrulanmış Müşteri Yorumları</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 list-disc pl-5">
          <li>
            Firmalar, gerçek müşterilerine tekil ve süreli bir davet bağlantısı (SMS/e-posta)
            göndererek yorum daveti yapabilir.
          </li>
          <li>
            Bu davet bağlantısıyla yazılan yorumlar{" "}
            <span className="font-medium text-blue-700">&quot;Firma davetiyle yazıldı&quot;</span>{" "}
            etiketiyle gösterilir.
          </li>
          <li>
            Davet edilen kullanıcı yorumunun içeriğine firma müdahale edemez; olumsuz yorum yazma
            hakkı saklıdır. Davet yalnızca yorumun kaynağını şeffaf biçimde belirtmek içindir.
          </li>
          <li>
            Her davet bağlantısı tek kullanımlıktır, belirli bir firmaya ve süreye bağlıdır.
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Yapmadığımız Şeyler</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 list-disc pl-5">
          <li>Sahte kullanıcı veya bot ile yorum üretmeyiz.</li>
          <li>Reklamı organik kullanıcı deneyimi gibi göstermeyiz.</li>
          <li>Firma lehine yorumların puanını veya sıralamasını gizlice değiştirmeyiz.</li>
        </ul>
      </section>

      <p className="mt-8 text-sm text-gray-500">
        Sorularınız için{" "}
        <Link href="/iletisim" className="text-primary hover:underline">
          iletişim
        </Link>{" "}
        sayfamızdan bize ulaşabilirsiniz.
      </p>
    </div>
  );
}
