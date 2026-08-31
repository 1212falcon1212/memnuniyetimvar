# MemnuniyetimVar Manuel Test Planı

Bu dosyada her testi sırayla çalıştırın. Hata varsa ilgili satırın **Hata Notu** alanına hata mesajını, ekran görüntüsünü veya davranış açıklamasını ekleyin. Hata yoksa **Sonuç** alanına `OK` yazın.

## Test Ortamı

- Backend: `http://localhost:4000/api`
- Frontend: `http://localhost:3000`
- Admin: `http://localhost:3001`
- Docker servisleri: PostgreSQL, Redis, Meilisearch, MinIO

## Başlangıç Kontrolleri

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `docker-compose up -d` çalıştır | Servisler ayakta |  |  |
| Backend başlat: `cd backend && npm run start:dev` | API 4000 portunda çalışır |  |  |
| Frontend başlat: `cd frontend && npm run dev` | Site 3000 portunda çalışır |  |  |
| Admin başlat: `cd admin && npm run dev` | Admin 3001 portunda çalışır |  |  |
| Backend health/manual endpoint kontrolü: `/api/companies/stats/global` | JSON success döner |  |  |

## Public Site - Genel

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Ana sayfa açılır | Sayfa hatasız yüklenir |  |  |
| Header menü linkleri çalışır | Linkler doğru sayfalara gider |  |  |
| Mobil görünümde menü açılır/kapanır | Menü düzgün çalışır |  |  |
| Footer linkleri çalışır | İlgili sayfalara gider |  |  |
| Ana sayfa arama kutusuna firma yazılır | `/arama?q=...` sayfasına gider |  |  |
| Ana sayfa istatistikleri görünür | Gerçek API verisi görünür |  |  |
| Ana sayfa gündemdeki memnuniyetler görünür | Son yorumlar listelenir |  |  |
| Ana sayfa popüler kategoriler görünür | Kategoriler listelenir |  |  |
| Ana sayfa en çok teşekkür edilenler görünür | Firmalar skorla listelenir |  |  |
| Ana sayfa trend firmalar görünür | Firmalar trend değeriyle listelenir |  |  |

## Arama

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Header arama kutusuna 2+ karakter yaz | Autocomplete dropdown açılır |  |  |
| Autocomplete firma önerisine tıkla | Firma detayına gider |  |  |
| Autocomplete kategori önerisine tıkla | Kategori detayına gider |  |  |
| `/arama?q=getir` aç | Firma/yorum/kategori sonuçları görünür |  |  |
| Sonuç olmayan arama yap | Boş state görünür |  |  |
| Meilisearch kapalıyken arama dene | Sayfa 500 vermez, fallback/error state gösterir |  |  |

## Firma Listeleme - `/firma`

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/firma` aç | Firma listesi görünür |  |  |
| Firma adı arama inputuna yaz | Liste filtrelenir, URL `search` param alır |  |  |
| Şehir filtresi seç | URL güncellenir, liste filtrelenir |  |  |
| Kategori filtresi seç | URL `categoryId` ile güncellenir |  |  |
| Sıralama değiştir | URL `sortBy` ile güncellenir |  |  |
| Pagination önceki/sonraki | Sayfa değişir, filtreler korunur |  |  |
| Filtre sonucu yok | Empty state görünür |  |  |
| Firma kartına tıkla | `/firma/[slug]` detayına gider |  |  |

## Firma Detay - `/firma/[slug]`

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Firma detay açılır | Header, skor, açıklama görünür |  |  |
| MemnuniyetEndeks bar görünür | Skor ve yanıt oranı gösterilir |  |  |
| Breadcrumb linkleri çalışır | Ana sayfa/firma/kategori linkleri çalışır |  |  |
| Yorum listesi görünür | Firma yorumları listelenir |  |  |
| Yorum sıralama değiştir | URL ve liste değişir |  |  |
| Rating filtresi seç | Sadece seçilen puan görünür |  |  |
| Pagination çalışır | Sayfa değişir |  |  |
| Firma yanıtı olan yorumda yanıt görünür | Yanıt kutusu görünür |  |  |
| `Yorum Yaz` butonuna tıkla | `/memnuniyet/yaz?firma=slug` gider |  |  |
| Geçersiz firma slug aç | Firma bulunamadı state görünür |  |  |

## Kategoriler

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/kategori` aç | Kategoriler listelenir |  |  |
| Kategori kartına tıkla | `/kategori/[slug]` açılır |  |  |
| Kategori detayında firmalar görünür | Kategori firmaları listelenir |  |  |
| Firma kartına tıkla | Firma detayına gider |  |  |
| Boş kategori açılırsa | Empty state görünür |  |  |

## Yorum Detay - `/memnuniyet/[slug]`

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Yorum detay açılır | Başlık, içerik, puan, kullanıcı, firma görünür |  |  |
| Görseller varsa galeri çalışır | Görseller düzgün görünür |  |  |
| Etiketlere tıkla | `/etiket/[slug]` sayfasına gider |  |  |
| Faydalı butonu çalışır | Sayaç artar veya auth uyarısı verir |  |  |
| Paylaş butonları görünür | Twitter/Facebook/WhatsApp/kopyala çalışır |  |  |
| Firma yanıtı varsa görünür | Yanıt alanı görünür |  |  |
| Benzer yorumlar görünür | Aynı firmadan diğer yorumlar listelenir |  |  |
| Geçersiz yorum slug aç | Yorum bulunamadı state görünür |  |  |

## Etiket Sayfası - `/etiket/[slug]`

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Etiket sayfası açılır | Etikete ait yorumlar görünür |  |  |
| Yorum kartına tıkla | Yorum detayına gider |  |  |
| Geçersiz etiket aç | Etiket bulunamadı state görünür |  |  |

## Auth - Kayıt / Giriş / Şifre

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/kayit` aç | Form görünür |  |  |
| Boş/yanlış form submit | Field validation görünür |  |  |
| Geçerli kayıt yap | `/profil?verify=1` yönlenir |  |  |
| `/giris` aç | Form görünür |  |  |
| Yanlış giriş bilgisi | API hata mesajı görünür |  |  |
| Doğru giriş bilgisi | Ana sayfaya yönlenir, token kaydedilir |  |  |
| `/sifre-sifirla` aç | Form görünür |  |  |
| Şifre sıfırlama gönder | Başarı veya hata mesajı görünür |  |  |
| Logout varsa çalışır | Token temizlenir |  |  |

## Profil - `/profil`

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Girişsiz `/profil` aç | Giriş yap uyarısı görünür |  |  |
| Girişli `/profil` aç | Kullanıcı bilgileri görünür |  |  |
| Bildirimler görünür | Bildirim listesi veya boş state görünür |  |  |
| Telefon doğrulanmamışsa Doğrula butonu | Kod gönderildi/hata mesajı görünür |  |  |
| E-posta doğrulanmamışsa Doğrula butonu | Kod gönderildi/hata mesajı görünür |  |  |
| `/profil?verify=1` aç | Doğrulama banner'ı görünür |  |  |

## Yorum Yazma - `/memnuniyet/yaz`

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Girişsiz aç | Giriş yapmanız gerekiyor state görünür |  |  |
| Girişli aç | Form görünür |  |  |
| `/memnuniyet/yaz?firma=getir` aç | Firma otomatik seçilir |  |  |
| Firma arama autocomplete | Firma sonuçları görünür |  |  |
| Rating seçmeden submit | Validation görünür |  |  |
| Kısa başlık/içerik | Validation görünür |  |  |
| Tag seç | En fazla 5 tag seçilebilir |  |  |
| Görsel ekle | Preview görünür |  |  |
| Görsel kaldır | Preview kaldırılır |  |  |
| Geçerli yorum gönder | Yorum detayına veya başarı sonucuna gider |  |  |
| Spam/link/yasak kelime dene | Backend hata veya pending/moderasyon mesajı verir |  |  |

## Statik Sayfalar

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/hakkimizda` aç | Yayınlanmışsa içerik görünür, yoksa 404 |  |  |
| `/kvkk` aç | Yayınlanmışsa içerik görünür, yoksa 404 |  |  |
| `/iletisim` aç | Yayınlanmışsa içerik görünür, yoksa 404 |  |  |

## SEO / Performans

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/sitemap.xml` aç | XML içinde statik + dinamik URL'ler görünür |  |  |
| `/robots.txt` aç | Production/dev uygun robots çıktısı görünür |  |  |
| Firma detay page source | Organization + BreadcrumbList JSON-LD var |  |  |
| Yorum detay page source | Review + BreadcrumbList JSON-LD var |  |  |
| Firma detay metadata | Title, description, canonical, OG var |  |  |
| Yorum detay metadata | Title, description, canonical, OG/Twitter var |  |  |
| Kategori detay metadata | Canonical + OG var |  |  |
| Lighthouse mobile | Kritik hata yok, hedef 90+ yakalanır |  |  |

## Admin - Giriş ve Koruma

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/dashboard` girişsiz aç | `/login` yönlenir |  |  |
| Admin login yanlış bilgi | Hata mesajı görünür |  |  |
| Admin login doğru bilgi | `/dashboard` açılır |  |  |
| Token silip admin route aç | `/login` yönlenir |  |  |
| Çıkış butonu | Token temizlenir, login'e gider |  |  |

## Admin - Dashboard

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| Dashboard açılır | İstatistik kartları gerçek API'den gelir |  |  |
| Bekleyen yorumlar listelenir | Liste veya boş state görünür |  |  |
| Dashboard onayla/reddet | Yorum listeden kalkar |  |  |
| Son aktiviteler görünür | Activity log listesi veya boş state |  |  |

## Admin - Yorum Yönetimi

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/yorumlar` aç | Tüm yorumlar listelenir |  |  |
| Tab filtreleri | Bekleyen/onaylanan/reddedilen filtrelenir |  |  |
| Yorum detay butonu | Modal açılır |  |  |
| Onayla | Status published olur |  |  |
| Reddet | Status rejected olur |  |  |
| Öne çıkar | Featured toggle çalışır |  |  |
| Sil | Confirm sonrası silinir |  |  |
| Toplu seçim | Seçili yorum sayısı görünür |  |  |
| Toplu onay/red | Seçili yorumlara işlem uygulanır |  |  |
| `/yorumlar/bekleyen` aç | Sadece pending yorumlar görünür |  |  |

## Admin - Firma Yönetimi

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/firmalar` aç | Firmalar listelenir |  |  |
| Firma ekle | Form açılır, kayıt oluşur |  |  |
| Firma düzenle | Form mevcut verilerle açılır |  |  |
| Kategori atama | Kategori seçilip kaydedilir |  |  |
| Durum değiştir | active/pending/hidden kaydedilir |  |  |
| Firma sil | Confirm sonrası silinir |  |  |
| Pagination | Çalışır |  |  |

## Admin - Sahiplenme Talepleri

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/firmalar/sahiplenme` aç | Talepler gerçek API'den listelenir |  |  |
| Belge linki varsa tıkla | Yeni sekmede açılır |  |  |
| Admin notu gir | Not yazılabilir |  |  |
| Onayla | Talep approved olur |  |  |
| Reddet | Talep rejected olur |  |  |

## Admin - Kullanıcı Yönetimi

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/kullanicilar` aç | Kullanıcılar listelenir |  |  |
| Aktif/Engelli filtreleri | Liste filtrelenir |  |  |
| Detay butonu | Modal açılır |  |  |
| Engelle | Kullanıcı banned olur |  |  |
| Engeli kaldır | Kullanıcı active olur |  |  |
| Pagination | Çalışır |  |  |

## Admin - Rapor Yönetimi

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/raporlar` aç | Raporlar listelenir |  |  |
| Status filtreleri | Liste filtrelenir |  |  |
| İncele | Status reviewed olur |  |  |
| Reddet/Dismiss | Status dismissed olur |  |  |
| Pagination | Çalışır |  |  |

## Admin - Kategoriler

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/kategoriler` aç | Kategori ağacı/listesi görünür |  |  |
| Kategori ekle | Kayıt oluşur |  |  |
| Kategori düzenle | Name/slug/icon/aktif/açıklama kaydedilir |  |  |
| Aktif/pasif değiştir | Kaydedilir |  |  |
| Empty/error state | Uygun mesaj görünür |  |  |

## Admin - Sayfalar

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/sayfalar` aç | Statik sayfalar gerçek API'den gelir |  |  |
| Sayfa ekle | Yeni sayfa oluşur |  |  |
| Sayfa düzenle | İçerik/SEO/yayında kaydedilir |  |  |
| Yayında sayfayı public aç | `/{slug}` içerik gösterir |  |  |

## Admin - Activity Logs

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `/aktivite-loglari` aç | Son loglar listelenir |  |  |
| Admin işleminden sonra log kontrolü | Yeni işlem loglarda görünür |  |  |

## API Smoke Testleri

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `GET /api/companies/stats/global` | success true + data |  |  |
| `GET /api/companies/top?limit=5` | `weeklyChange` alanı var |  |  |
| `GET /api/companies/trending?limit=5` | `growthPercent` alanı var |  |  |
| `GET /api/search/suggest?q=get` | Öneriler döner |  |  |
| `GET /api/categories/popular` | Kategoriler döner |  |  |
| `GET /api/pages` | Yayınlanmış sayfalar döner |  |  |

## Build/Test Doğrulama

| Test | Beklenen | Sonuç | Hata Notu |
|---|---|---|---|
| `cd backend && npm run build` | Başarılı |  |  |
| `cd backend && npm test` | Başarılı veya bilinen test sonucu |  |  |
| `cd frontend && npx next build` | Başarılı |  |  |
| `cd admin && npm run build` | Başarılı |  |  |

## Genel Notlar

- Hata bulursanız, hatayı aynı satırın **Hata Notu** alanına yazın.
- Eğer hata konsolda ise console çıktısını ekleyin.
- Eğer API hatası ise status code ve response body ekleyin.
- Eğer UI bozukluğu ise sayfa URL'si, ekran boyutu ve beklenen/görünen davranışı yazın.
