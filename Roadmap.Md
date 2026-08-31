# MemnuniyetimVar Roadmap

Bu roadmap, `memnuniyetimvar-proje-paketi.md` vizyonu ve mevcut kod incelemesinde tespit edilen eksiklere göre hazırlanmıştır.

## Öncelik Sırası

1. Önce çekirdek sistemi production-ready hale getir.
2. Sonra admin, SEO, moderasyon ve güvenlik katmanlarını tamamla.
3. En son reklam, marka iş birlikleri ve büyüme araçlarını yasal/doğrulanabilir akışlarla geliştir.

## Faz 0 - Acil Düzeltmeler

- [x] Admin build hatasını düzelt: `ConfirmDialog` import/prop uyumsuzluğu.
- [x] Yorum görsel yükleme akışını düzelt: frontend `FormData` gönderiyor, backend UUID ve `imageUrls` bekliyor.
- [x] `dist`, `.next`, `tsconfig.tsbuildinfo` gibi build çıktılarını repo dışında tutacak `.gitignore` kontrolünü tamamla.
- [x] Admin API base URL kullanımını standartlaştır.
- [x] Frontend ve admin build uyarısındaki çoklu lockfile/workspace root problemini çöz.
- [x] Backend test kapsamını 1 smoke test seviyesinden gerçek servis/controller testlerine çıkar.

## Faz 1 - Backend Çekirdek Tamamlama

- [x] Kullanıcı endpointlerini tamamla: profil güncelleme, avatar, kendi yorumlarım, bildirimler.
- [x] Tüm admin endpointlerinde `Partial<Entity>` yerine DTO + `class-validator` kullan.
- [x] Admin işlemlerinde role-based authorization ekle: admin, super_admin, editor.
- [x] Tüm public/private endpointlerde Swagger response decorator kapsamını tamamla.
- [x] Her endpoint için tutarlı response/error formatını doğrula.
- [x] Slug üretimini çakışma güvenli hale getir; DB kontrolü veya retry mekanizması ekle.
- [x] Yorum, firma ve kategori işlemlerinde transaction gereken yerleri transaction içine al.
- [x] Firma sayaçlarını yalnızca yayınlanmış yorumlara göre güncelle.
- [x] `avgRating`, `responseRate`, `reviewCount`, `memnuniyetScore` hesaplama servislerini ekle.
- [x] Yorum silme/onay/red işlemlerinde counter cache tutarlılığını sağla.
- [x] Raporlama endpointleri ve kullanıcı bildirim endpointlerini tamamla.
- [x] Activity log kapsamını tüm kritik admin işlemlerine yay.

## Faz 2 - Auth, Güvenlik ve Moderasyon

- [x] Telefon doğrulama tekrar gönder endpointini dışa aç ve rate limit uygula.
- [x] Email doğrulama tekrar gönder akışı ekle.
- [x] Refresh token device info ve ip bilgisini kaydet.
- [x] Logout/all-devices logout akışı ekle.
- [x] Admin JWT secret ve user JWT secret ayrımını netleştir.
- [x] Rate limitleri endpoint bazlı ayarla: auth, yorum yazma, raporlama, firma önerme.
- [x] Basit spam filtresi ekle: tekrar eden içerik, link yoğunluğu, yasaklı kelime, aşırı frekans.
- [x] Moderasyon kuyruğunu BullMQ ile gerçek akışa bağla.
- [x] Şüpheli yorumları otomatik pending/review-required statüsüne düşür.
- [x] Kullanıcıya hata ve moderasyon durumlarını açıkça bildir.

## Faz 3 - Arama ve Veri Entegrasyonu

- [x] Meilisearch indexleme akışını firma/yorum create-update-delete işlemlerine bağla.
- [x] `/companies/search` endpointini DB `ILIKE` yerine Meilisearch kullanacak şekilde güncelle.
- [x] Genel arama sonuçlarında firma, kategori ve yorum ayrımını netleştir.
- [x] Arama önerileri endpointini tamamla.
- [x] Seed veriyi gerçekçi ama açıkça test verisi olacak şekilde düzenle.
- [x] Kategori ağacı, popüler kategori ve kategori bazlı firma sorgularını performans açısından gözden geçir.

## Faz 4 - Frontend Public Site

- [x] Ana sayfadaki hardcoded platform istatistiklerini gerçek `/stats/global` endpointine bağla.
- [x] `Math.random()` ile üretilen trend/growth/change değerlerini gerçek veriye bağla.
- [x] Tüm route group'lar için `loading.tsx` ve `error.tsx` ekle.
- [x] Firma listeleme sayfasında filtreleme, sıralama, pagination ve empty/error/loading state'leri tamamla.
- [x] Firma detay sayfasında yorum filtreleme, firma yanıtları ve MemnuniyetEndeks bileşenlerini tamamla.
- [x] Yorum detay sayfasında metadata, structured data ve paylaşım bileşenlerini tamamla.
- [x] Yorum yazma formunda firma arama, tag seçimi ve görsel yükleme akışını backend ile uyumlu hale getir.
- [x] Auth sayfalarında kullanıcıya doğrulama ve hata durumlarını net göster.
- [x] Profil sayfasını gerçek kullanıcı verisine bağla.
- [x] `next/image` kullanımını yaygınlaştır; düz `img` kullanılan alanları dönüştür.

## Faz 5 - Admin Panel

- [x] Admin login sonrası token doğrulama ve route protection akışını netleştir.
- [x] Dashboard istatistiklerini gerçek API verileriyle zenginleştir.
- [x] Yorum yönetimi: onay, red, öne çıkar, sil, detay görüntüleme, toplu işlem.
- [x] Firma yönetimi: ekle, düzenle, sil, durum yönetimi, kategori atama.
- [x] Firma sahiplenme talepleri: belge görüntüleme, onay/red, not ekleme.
- [x] Kullanıcı yönetimi: liste, filtre, engelle, engel kaldır, detay.
- [x] Rapor yönetimi: incele, dismiss, aksiyon logu.
- [x] Kategori yönetimi: ağaç yapı, sıralama, ikon, aktif/pasif.
- [x] Sayfa yönetimini mock data yerine gerçek `pages` API ile bağla.
- [x] Activity log görüntüleme ekranı ekle.
- [x] Tüm admin tablolarında loading, error, empty, pagination state'lerini standartlaştır.

## Faz 6 - SEO ve Performans

- [x] Dinamik sitemap oluştur: firma, kategori, yorum ve statik sayfa slug'ları dahil.
- [x] `robots.txt` production ayarlarını kontrol et.
- [x] Firma ve yorum sayfalarına Schema.org `Organization`, `Review`, `BreadcrumbList` ekle.
- [x] Open Graph ve Twitter Card metadata kapsamını tamamla.
- [x] Canonical URL yapısını ekle.
- [x] Firma ve kategori sayfaları için ISR/cache stratejisini netleştir.
- [x] Redis cache stratejisi ekle: popüler firmalar, kategoriler, global istatistikler.
- [x] Lighthouse 90+ hedefi için görsel, font ve bundle optimizasyonu yap.

## Faz 7 - Bildirim, E-posta ve Dosya Yönetimi

- [x] Bildirim sistemi endpointlerini tamamla: listele, okundu işaretle, toplu okundu.
- [x] Yorum onaylandı, reddedildi, firma yanıtladı bildirimleri ekle.
- [x] E-posta gönderimlerini BullMQ kuyruğuna bağla.
- [x] MinIO/S3 upload servisinde dosya tipi, boyut ve güvenlik kontrollerini tamamla.
- [x] Thumbnail/WebP dönüşümü ekle.
- [x] Kullanıcı avatarı, firma logosu, firma kapak görseli ve yorum görselleri için ayrı upload policy belirle.

## Faz 8 - Yasal Reklam ve Marka İş Birliği Modülü

Not: Sahte kullanıcı yorumu üretme, gerçek kullanıcı gibi davranma, proxy/Gmail hesaplarıyla manipülatif yorum girme veya reklamı organik kullanıcı deneyimi gibi gösterme akışı geliştirilmez. Bu yaklaşım platform güvenini, hukuki uyumu ve marka itibarını riske atar.

Yasal ve sürdürülebilir alternatif:

- [x] Marka reklam paketleri tasarla: sponsorlu firma vitrini, öne çıkan kampanya, kategori sponsorluğu.
- [x] Sponsorlu içerikleri açıkça `Sponsorlu` etiketiyle göster.
- [x] Firma panelinden reklam talebi oluşturma akışı ekle. (Sahip-kapsamlı API akışı: POST /advertising/requests, /requests/mine, iptal)
- [x] Admin panelinde reklam talepleri yönetimi ekle: teklif, onay, yayın takvimi, bütçe, raporlama.
- [x] Doğrulanmış müşteri yorumu kampanyası tasarla: firma gerçek müşterilerine davet linki/SMS/e-posta gönderir.
- [x] Davet linkleri için tekil token, süre, kampanya ve firma eşleştirmesi ekle.
- [x] Yorumların `verifiedCustomer` olarak işaretlenebilmesi için davet token doğrulama akışı eklendi (review.source + invitationId).
- [x] Teşvikli yorum varsa bunu açıkça göster: `Firma davetiyle yazıldı` etiketi.
- [x] Reklam performans raporu ekle: görüntülenme, tıklama, yorum daveti dönüşümü, yayın süresi.
- [x] Şeffaflık politikası sayfası ekle: sponsorlu içerik ve doğrulanmış yorum kriterleri.

## Faz 9 - Güvenilirlik ve Kötüye Kullanım Önleme

- [ ] Aynı kullanıcı, cihaz, IP veya içerik benzerliği üzerinden anomali tespiti ekle.
- [ ] Admin panelinde şüpheli aktivite görünümü ekle.
- [ ] Yorum güven skorunu hesapla: hesap yaşı, doğrulama durumu, içerik kalitesi, tekrar oranı.
- [ ] Proxy/VPN/Tor tespit servisleriyle risk skoru üret; amaç sahte yorum yapmak değil, kötüye kullanımı engellemek olmalı.
- [ ] Şüpheli yorumları otomatik moderasyona gönder.
- [ ] KVKK uyumlu log saklama politikası belirle.
- [ ] Kullanıcıya açık itiraz/düzeltme mekanizması ekle.

## Faz 10 - Deployment ve Operasyon

- [ ] Production env checklist hazırla.
- [ ] Migration çalıştırma ve rollback prosedürü yaz.
- [ ] PM2 cluster/env ayarlarını production için doğrula.
- [ ] Nginx reverse proxy ve SSL dokümantasyonunu ekle.
- [ ] `deploy.sh` scriptine preflight build/test kontrolleri ekle.
- [ ] Sentry veya benzeri error tracking kur.
- [ ] UptimeRobot healthcheck endpointi ekle.
- [ ] Basit smoke test komutları hazırla.
- [ ] Backup stratejisi oluştur: PostgreSQL, MinIO, Meilisearch.

## Tamamlanma Kriterleri

- [x] `backend npm run build` başarılı.
- [x] `backend npm test` anlamlı test kapsamıyla başarılı. (72 test, 10 suite)
- [x] `frontend npm run build` başarılı.
- [x] `admin npm run build` başarılı.
- [ ] Tüm kritik endpointlerde DTO validation var.
- [ ] Public frontend gerçek API kaynaklarından veri çekiyor.
- [ ] Admin panel mock data kullanmıyor.
- [ ] Yorum, firma, kategori ve arama akışları uçtan uca çalışıyor.
- [ ] SEO için dinamik sitemap, metadata ve structured data tamam.
- [x] Reklam/sponsorlu içerikler şeffaf ve açıkça etiketli.
