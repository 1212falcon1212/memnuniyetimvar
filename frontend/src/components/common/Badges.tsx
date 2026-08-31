/**
 * Şeffaflık etiketleri (Faz 8).
 * Sponsorlu içerikler ve firma davetiyle yazılan doğrulanmış müşteri yorumları
 * kullanıcıya açıkça gösterilir.
 */

export function SponsoredBadge() {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
      title="Bu firma sponsorlu olarak öne çıkarılmıştır"
    >
      ⭐ Sponsorlu
    </span>
  );
}

export function VerifiedCustomerBadge() {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
      title="Bu yorum, firmanın gönderdiği davet bağlantısı ile yazılmıştır"
    >
      ✔ Firma davetiyle yazıldı
    </span>
  );
}
