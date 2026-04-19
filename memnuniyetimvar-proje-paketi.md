# MemnuniyetimVar — Proje Paketi

## 1. Proje Vizyonu

**Konsept:** Şikayetvar.com'un pozitif aynası. Kullanıcılar memnuniyetlerini, teşekkürlerini ve olumlu deneyimlerini paylaşır. Firmalar itibarlarını güçlendirir, potansiyel müşteriler karar verirken olumlu referanslara ulaşır.

**Motto:** "Teşekkür için: MemnuniyetimVar"

**Fark:** Şikayetvar şikayet → çözüm döngüsüne odaklanırken, MemnuniyetimVar takdir → tanıtım döngüsüne odaklanır. Firmalar için bir "pozitif itibar vitrini", kullanıcılar için ise "güvenilir referans noktası" görevi görür.

---

## 2. Tech Stack

| Katman | Teknoloji | Gerekçe |
|--------|-----------|---------|
| **Frontend (Public)** | Next.js 15 (App Router) | SSR/SSG ile SEO, Türkçe URL yapısı, hızlı sayfa geçişleri |
| **Backend API** | NestJS | Modüler mimari, TypeORM, Guard/Interceptor yapısı, Swagger |
| **Veritabanı** | PostgreSQL 16 | Full-text search (Türkçe), JSON desteği, güvenilirlik |
| **Arama Motoru** | Meilisearch | Anlık arama, typo-tolerant, Türkçe tokenizer |
| **Önbellek & Kuyruk** | Redis + BullMQ | Popüler firma cache, e-posta kuyruğu, rate limiting |
| **Dosya Depolama** | S3 (MinIO / AWS) | Yorum görselleri, firma logoları |
| **E-posta** | Nodemailer + SMTP | Doğrulama, bildirimler |
| **Auth** | JWT + Refresh Token | SMS doğrulama (Netgsm/İleti Merkezi) |
| **Deployment** | VPS + Nginx + PM2 | deploy.sh + GitHub webhook |
| **Monitoring** | PM2 + UptimeRobot | Basit ve etkili |

---

## 3. Veritabanı Şeması (22 Tablo)

### 3.1 Kullanıcı & Auth

```
┌─────────────────────────────────┐
│ users                           │
├─────────────────────────────────┤
│ id              UUID PK         │
│ full_name       VARCHAR(100)    │
│ email           VARCHAR(255) UQ │
│ phone           VARCHAR(20) UQ  │
│ password_hash   VARCHAR(255)    │
│ avatar_url      VARCHAR(500)    │
│ is_phone_verified BOOLEAN       │
│ is_email_verified BOOLEAN       │
│ role            ENUM(user,mod)  │
│ status          ENUM(active,    │
│                 banned,deleted) │
│ review_count    INT DEFAULT 0   │
│ helpful_count   INT DEFAULT 0   │
│ created_at      TIMESTAMP       │
│ updated_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ admin_users                     │
├─────────────────────────────────┤
│ id              UUID PK         │
│ email           VARCHAR(255) UQ │
│ password_hash   VARCHAR(255)    │
│ full_name       VARCHAR(100)    │
│ role            ENUM(admin,     │
│                 super_admin,    │
│                 editor)         │
│ last_login_at   TIMESTAMP       │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ refresh_tokens                  │
├─────────────────────────────────┤
│ id              UUID PK         │
│ user_id         UUID FK→users   │
│ token           VARCHAR(500)    │
│ expires_at      TIMESTAMP       │
│ device_info     VARCHAR(255)    │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘
```

### 3.2 Firma & Kategori

```
┌─────────────────────────────────┐
│ categories                      │
├─────────────────────────────────┤
│ id              SERIAL PK       │
│ parent_id       INT FK→self     │
│ name            VARCHAR(100)    │
│ slug            VARCHAR(120) UQ │
│ icon            VARCHAR(100)    │
│ description     TEXT            │
│ sort_order      INT DEFAULT 0   │
│ is_active       BOOLEAN         │
│ review_count    INT DEFAULT 0   │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ companies                       │
├─────────────────────────────────┤
│ id              UUID PK         │
│ name            VARCHAR(200)    │
│ slug            VARCHAR(220) UQ │
│ logo_url        VARCHAR(500)    │
│ cover_url       VARCHAR(500)    │
│ description     TEXT            │
│ website         VARCHAR(300)    │
│ phone           VARCHAR(20)     │
│ email           VARCHAR(255)    │
│ address         TEXT            │
│ city            VARCHAR(50)     │
│ district        VARCHAR(50)     │
│ tax_number      VARCHAR(20)     │
│ is_verified     BOOLEAN         │ ← firma doğrulandı mı
│ is_claimed      BOOLEAN         │ ← firma sahiplenildi mi
│ status          ENUM(active,    │
│                 pending,hidden) │
│ avg_rating      DECIMAL(3,2)    │
│ review_count    INT DEFAULT 0   │
│ response_count  INT DEFAULT 0   │
│ response_rate   DECIMAL(5,2)    │
│ memnuniyet_score DECIMAL(5,2)   │ ← MemnuniyetEndeks
│ category_id     INT FK→cats     │
│ created_at      TIMESTAMP       │
│ updated_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ company_categories (M2M)        │
├─────────────────────────────────┤
│ company_id      UUID FK         │
│ category_id     INT FK          │
│ PK(company_id, category_id)     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ company_claims                  │
├─────────────────────────────────┤
│ id              UUID PK         │
│ company_id      UUID FK         │
│ claimer_name    VARCHAR(100)    │
│ claimer_email   VARCHAR(255)    │
│ claimer_phone   VARCHAR(20)     │
│ document_url    VARCHAR(500)    │ ← vergi levhası vs.
│ status          ENUM(pending,   │
│                 approved,       │
│                 rejected)       │
│ admin_note      TEXT            │
│ created_at      TIMESTAMP       │
│ reviewed_at     TIMESTAMP       │
└─────────────────────────────────┘
```

### 3.3 Memnuniyet (Review) Sistemi

```
┌─────────────────────────────────┐
│ reviews                         │
├─────────────────────────────────┤
│ id              UUID PK         │
│ user_id         UUID FK→users   │
│ company_id      UUID FK→comps   │
│ title           VARCHAR(200)    │
│ content         TEXT NOT NULL    │
│ rating          SMALLINT(1-5)   │
│ status          ENUM(pending,   │
│                 published,      │
│                 rejected,       │
│                 archived)       │
│ rejection_reason TEXT           │
│ is_featured     BOOLEAN         │ ← öne çıkan
│ view_count      INT DEFAULT 0   │
│ helpful_count   INT DEFAULT 0   │
│ slug            VARCHAR(250) UQ │
│ moderated_by    UUID FK→admins  │
│ moderated_at    TIMESTAMP       │
│ published_at    TIMESTAMP       │
│ created_at      TIMESTAMP       │
│ updated_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ review_images                   │
├─────────────────────────────────┤
│ id              UUID PK         │
│ review_id       UUID FK         │
│ image_url       VARCHAR(500)    │
│ thumbnail_url   VARCHAR(500)    │
│ sort_order      INT DEFAULT 0   │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ review_helpfuls                 │
├─────────────────────────────────┤
│ id              UUID PK         │
│ review_id       UUID FK         │
│ user_id         UUID FK         │
│ created_at      TIMESTAMP       │
│ UQ(review_id, user_id)          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ company_responses               │
├─────────────────────────────────┤
│ id              UUID PK         │
│ review_id       UUID FK         │
│ company_id      UUID FK         │
│ content         TEXT NOT NULL    │
│ responder_name  VARCHAR(100)    │
│ status          ENUM(published, │
│                 hidden)         │
│ created_at      TIMESTAMP       │
│ updated_at      TIMESTAMP       │
└─────────────────────────────────┘
```

### 3.4 Etiket & İçerik

```
┌─────────────────────────────────┐
│ tags                            │
├─────────────────────────────────┤
│ id              SERIAL PK       │
│ name            VARCHAR(50) UQ  │
│ slug            VARCHAR(60) UQ  │
│ usage_count     INT DEFAULT 0   │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ review_tags (M2M)               │
├─────────────────────────────────┤
│ review_id       UUID FK         │
│ tag_id          INT FK          │
│ PK(review_id, tag_id)           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ pages (statik sayfalar)         │
├─────────────────────────────────┤
│ id              SERIAL PK       │
│ title           VARCHAR(200)    │
│ slug            VARCHAR(220) UQ │
│ content         TEXT            │
│ meta_title      VARCHAR(200)    │
│ meta_description VARCHAR(300)   │
│ is_published    BOOLEAN         │
│ created_at      TIMESTAMP       │
│ updated_at      TIMESTAMP       │
└─────────────────────────────────┘
```

### 3.5 Bildirim & Raporlama

```
┌─────────────────────────────────┐
│ notifications                   │
├─────────────────────────────────┤
│ id              UUID PK         │
│ user_id         UUID FK         │
│ type            VARCHAR(50)     │ ← review_published, response_received, etc.
│ title           VARCHAR(200)    │
│ message         TEXT            │
│ data            JSONB           │ ← {reviewId, companySlug, ...}
│ is_read         BOOLEAN         │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ reports (spam/kötüye kullanım)  │
├─────────────────────────────────┤
│ id              UUID PK         │
│ reporter_id     UUID FK→users   │
│ review_id       UUID FK         │
│ reason          ENUM(spam,fake, │
│                 inappropriate,  │
│                 other)          │
│ description     TEXT            │
│ status          ENUM(pending,   │
│                 reviewed,       │
│                 dismissed)      │
│ reviewed_by     UUID FK→admins  │
│ created_at      TIMESTAMP       │
│ reviewed_at     TIMESTAMP       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ activity_logs                   │
├─────────────────────────────────┤
│ id              UUID PK         │
│ admin_id        UUID FK→admins  │
│ action          VARCHAR(50)     │
│ entity_type     VARCHAR(50)     │
│ entity_id       UUID            │
│ details         JSONB           │
│ ip_address      VARCHAR(45)     │
│ created_at      TIMESTAMP       │
└─────────────────────────────────┘
```

---

## 4. API Endpoint Haritası (~65 Endpoint)

### 4.1 Auth (8 endpoint)
```
POST   /api/auth/register              Kayıt (telefon + email)
POST   /api/auth/login                 Giriş
POST   /api/auth/logout                Çıkış
POST   /api/auth/refresh               Token yenileme
POST   /api/auth/verify-phone          SMS doğrulama
POST   /api/auth/verify-email          Email doğrulama
POST   /api/auth/forgot-password       Şifre sıfırlama talebi
POST   /api/auth/reset-password        Şifre sıfırlama
```

### 4.2 Kullanıcı (6 endpoint)
```
GET    /api/users/me                   Profil bilgileri
PATCH  /api/users/me                   Profil güncelle
PATCH  /api/users/me/avatar            Avatar güncelle
GET    /api/users/me/reviews           Kendi yorumlarım
GET    /api/users/me/notifications     Bildirimlerim
PATCH  /api/users/me/notifications/:id Okundu işaretle
```

### 4.3 Firma (10 endpoint)
```
GET    /api/companies                  Firma listesi (filtreleme, sayfalama)
GET    /api/companies/:slug            Firma detay
GET    /api/companies/:slug/reviews    Firma yorumları
GET    /api/companies/:slug/stats      Firma istatistikleri
GET    /api/companies/search           Firma arama (Meilisearch)
GET    /api/companies/top              En çok teşekkür edilen firmalar
GET    /api/companies/trending         Trend firmalar
POST   /api/companies/suggest          Yeni firma öner
POST   /api/companies/:id/claim        Firma sahiplenme talebi
GET    /api/companies/by-category/:slug Kategoriye göre firmalar
```

### 4.4 Memnuniyet / Yorum (10 endpoint)
```
POST   /api/reviews                    Yorum yaz
GET    /api/reviews/:slug              Yorum detay
PATCH  /api/reviews/:id                Yorum düzenle (pending iken)
DELETE /api/reviews/:id                Yorum sil (kendi yorumu)
POST   /api/reviews/:id/helpful        Faydalı bul
DELETE /api/reviews/:id/helpful        Faydalı bulma geri al
POST   /api/reviews/:id/report         Yorum bildir
GET    /api/reviews/latest             Son yorumlar
GET    /api/reviews/featured           Öne çıkan yorumlar
POST   /api/reviews/:id/images         Görsel yükle
```

### 4.5 Kategori (4 endpoint)
```
GET    /api/categories                 Tüm kategoriler (tree)
GET    /api/categories/:slug           Kategori detay + firmalar
GET    /api/categories/:slug/top       Kategorinin en iyi firmaları
GET    /api/categories/popular         Popüler kategoriler
```

### 4.6 Etiket & Arama (4 endpoint)
```
GET    /api/tags                       Popüler etiketler
GET    /api/tags/:slug                 Etikete göre yorumlar
GET    /api/search                     Genel arama
GET    /api/search/suggestions         Otomatik tamamlama
```

### 4.7 Sayfalar & İçerik (3 endpoint)
```
GET    /api/pages/:slug                Statik sayfa (hakkımızda, kvkk vs.)
GET    /api/stats/global               Genel istatistikler (hero bölümü)
GET    /api/sitemap                    Sitemap data
```

### 4.8 Admin Panel API (20 endpoint)
```
POST   /api/admin/auth/login           Admin giriş
GET    /api/admin/dashboard            Dashboard istatistikleri

GET    /api/admin/reviews              Tüm yorumlar (filtreli)
PATCH  /api/admin/reviews/:id/approve  Yorum onayla
PATCH  /api/admin/reviews/:id/reject   Yorum reddet
PATCH  /api/admin/reviews/:id/feature  Öne çıkar
DELETE /api/admin/reviews/:id          Yorum sil

GET    /api/admin/companies            Firma yönetimi
POST   /api/admin/companies            Firma ekle
PATCH  /api/admin/companies/:id        Firma düzenle
DELETE /api/admin/companies/:id        Firma sil
GET    /api/admin/companies/claims     Sahiplenme talepleri
PATCH  /api/admin/companies/claims/:id Talebi onayla/reddet

GET    /api/admin/users                Kullanıcı listesi
PATCH  /api/admin/users/:id/ban        Kullanıcı engelle
PATCH  /api/admin/users/:id/unban      Engel kaldır

GET    /api/admin/reports              Raporlar
PATCH  /api/admin/reports/:id          Rapor işle

GET    /api/admin/categories           Kategori yönetimi
POST   /api/admin/categories           Kategori ekle/düzenle
```

---

## 5. Teknik Yol Haritası (7 Faz, ~16 Hafta)

### FAZ 1 — Temel Altyapı (Hafta 1-2)
**Hedef:** Projenin iskeleti, auth sistemi, veritabanı

- [ ] NestJS projesi scaffold (modüler yapı)
- [ ] Next.js 15 App Router projesi scaffold
- [ ] PostgreSQL + TypeORM konfigürasyonu
- [ ] Tüm entity'ler ve migration'lar
- [ ] Auth modülü (JWT, refresh token, guards)
- [ ] SMS doğrulama entegrasyonu (Netgsm)
- [ ] Email doğrulama (Nodemailer)
- [ ] Redis bağlantısı
- [ ] Global exception filter, validation pipe
- [ ] Swagger/OpenAPI dokümantasyonu
- [ ] Ortak layout, header, footer (Next.js)
- [ ] Tailwind CSS + tema yapılandırması

**Çıktı:** Çalışan auth flow, boş ama yapılandırılmış proje

### FAZ 2 — Firma & Kategori (Hafta 3-4)
**Hedef:** Firma CRUD, kategori sistemi, arama altyapısı

- [ ] Kategori CRUD + nested tree yapısı
- [ ] Firma CRUD + slug üretimi (Türkçe URL)
- [ ] Firma sahiplenme (claim) sistemi
- [ ] Meilisearch entegrasyonu (firma indexleme)
- [ ] Firma arama + otomatik tamamlama
- [ ] Firma detay sayfası (Next.js SSR)
- [ ] Kategori listeleme sayfası
- [ ] Firma listeleme + filtreleme sayfası
- [ ] Görsel upload (S3/MinIO) + thumbnail
- [ ] SEO meta tag'leri (Next.js metadata API)

**Çıktı:** Firmalar listelenebilir, aranabilir, detay sayfaları SEO-uyumlu

### FAZ 3 — Memnuniyet (Yorum) Sistemi (Hafta 5-7)
**Hedef:** Ana özellik — yorum yazma, listeleme, moderasyon

- [ ] Yorum yazma formu + validasyon
- [ ] Yorum listeleme (firma sayfasında)
- [ ] Yorum detay sayfası (SEO-uyumlu slug)
- [ ] Yorum görseli yükleme (max 5 resim)
- [ ] "Faydalı bul" (like) sistemi
- [ ] Etiket sistemi (yorum yazarken etiket seç)
- [ ] Yorum moderasyon kuyruğu (BullMQ)
- [ ] Otomatik spam filtre (basit keyword + rate limit)
- [ ] Firma yanıt sistemi
- [ ] MemnuniyetEndeks hesaplama (rating avg + response rate)
- [ ] Son yorumlar feed
- [ ] Öne çıkan yorumlar

**Çıktı:** Kullanıcılar yorum yazabilir, firmalar yanıtlayabilir, moderasyon çalışır

### FAZ 4 — Admin Paneli (Hafta 8-10)
**Hedef:** Tam kapsamlı yönetim arayüzü

- [ ] Admin auth (ayrı JWT, role-based)
- [ ] Dashboard (toplam istatistikler, grafikler)
- [ ] Yorum yönetimi (onayla/reddet/öne çıkar)
- [ ] Firma yönetimi (ekle/düzenle/sil)
- [ ] Firma sahiplenme talepleri yönetimi
- [ ] Kullanıcı yönetimi (listele/engelle)
- [ ] Rapor (şikayet) yönetimi
- [ ] Kategori yönetimi (sıralama, ikon)
- [ ] Statik sayfa yönetimi (KVKK, Hakkımızda)
- [ ] Activity log görüntüleme
- [ ] Toplu işlem (batch approve/reject)

**Çıktı:** Tam işlevsel admin paneli, tüm içerik yönetilebilir

### FAZ 5 — SEO & Performans (Hafta 11-12)
**Hedef:** Organik trafik için optimizasyon

- [ ] Dinamik sitemap.xml üretimi
- [ ] robots.txt konfigürasyonu
- [ ] Structured data (Schema.org — Review, Organization)
- [ ] Open Graph + Twitter Card meta
- [ ] Canonical URL'ler
- [ ] Firma sayfaları ISR (Incremental Static Regeneration)
- [ ] Redis cache stratejisi (popüler sayfalar)
- [ ] Görsel lazy loading + WebP dönüşümü
- [ ] Lighthouse 90+ skor hedefi
- [ ] Breadcrumb navigasyon
- [ ] İç linkleme stratejisi

**Çıktı:** Google'da indekslenmeye hazır, hızlı ve SEO-uyumlu site

### FAZ 6 — Bildirim & Sosyal (Hafta 13-14)
**Hedef:** Kullanıcı etkileşimi ve geri dönüş

- [ ] Bildirim sistemi (yorum onaylandı, firma yanıtladı)
- [ ] E-posta bildirimleri (BullMQ ile kuyruk)
- [ ] Kullanıcı profil sayfası (public)
- [ ] Yorum paylaşma (sosyal medya butonları)
- [ ] "En çok teşekkür edilen firmalar" sayfası
- [ ] "Trend firmalar" (son 7 gün)
- [ ] Firma karşılaştırma (basit, 2-3 firma)
- [ ] RSS feed
- [ ] PWA desteği (manifest.json, service worker)

**Çıktı:** Aktif kullanıcı döngüsü, sosyal paylaşım, PWA

### FAZ 7 — Lansman & İyileştirme (Hafta 15-16)
**Hedef:** Production deploy, son testler, lansman

- [ ] VPS kurulumu (Nginx + SSL + PM2)
- [ ] deploy.sh script (GitHub webhook)
- [ ] Environment değişkenleri (.env.production)
- [ ] Rate limiting (IP bazlı, API bazlı)
- [ ] KVKK uyumluluk sayfaları
- [ ] Cookie consent banner
- [ ] Error tracking (Sentry free tier)
- [ ] Smoke test + load test (basit)
- [ ] Analytics (Plausible veya Google Analytics)
- [ ] Lansman checklist kontrolü
- [ ] Sosyal medya hesapları + ilk içerik

**Çıktı:** Canlıda çalışan, production-ready platform

---

## 6. Proje Klasör Yapısı

```
memnuniyetimvar/
├── backend/                          ← NestJS
│   ├── src/
│   │   ├── common/
│   │   │   ├── decorators/           ← @CurrentUser, @Roles vs.
│   │   │   ├── filters/              ← GlobalExceptionFilter
│   │   │   ├── guards/               ← JwtAuthGuard, RolesGuard, AdminGuard
│   │   │   ├── interceptors/         ← TransformInterceptor
│   │   │   ├── pipes/                ← ValidationPipe
│   │   │   ├── dto/                  ← PaginationDto, SortDto
│   │   │   └── utils/                ← slug.util, sms.util
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   ├── meilisearch.config.ts
│   │   │   ├── s3.config.ts
│   │   │   └── mail.config.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/       ← jwt.strategy, local.strategy
│   │   │   │   └── dto/
│   │   │   ├── users/
│   │   │   │   ├── entities/user.entity.ts
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/
│   │   │   ├── companies/
│   │   │   │   ├── entities/company.entity.ts
│   │   │   │   ├── companies.module.ts
│   │   │   │   ├── companies.controller.ts
│   │   │   │   ├── companies.service.ts
│   │   │   │   └── dto/
│   │   │   ├── reviews/
│   │   │   │   ├── entities/review.entity.ts
│   │   │   │   ├── reviews.module.ts
│   │   │   │   ├── reviews.controller.ts
│   │   │   │   ├── reviews.service.ts
│   │   │   │   └── dto/
│   │   │   ├── categories/
│   │   │   │   ├── entities/category.entity.ts
│   │   │   │   ├── categories.module.ts
│   │   │   │   ├── categories.controller.ts
│   │   │   │   ├── categories.service.ts
│   │   │   │   └── dto/
│   │   │   ├── tags/
│   │   │   ├── notifications/
│   │   │   ├── reports/
│   │   │   ├── upload/               ← S3 upload service
│   │   │   ├── search/               ← Meilisearch service
│   │   │   ├── mail/                 ← Email service
│   │   │   └── admin/
│   │   │       ├── admin.module.ts
│   │   │       ├── dashboard/
│   │   │       ├── review-moderation/
│   │   │       ├── company-management/
│   │   │       ├── user-management/
│   │   │       └── report-management/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeds/                ← Kategori seed, test data
│   │   ├── queue/
│   │   │   ├── processors/          ← mail.processor, moderation.processor
│   │   │   └── queue.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                         ← Next.js 15 (Public Site)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            ← Root layout
│   │   │   ├── page.tsx              ← Anasayfa
│   │   │   ├── (auth)/
│   │   │   │   ├── giris/page.tsx
│   │   │   │   ├── kayit/page.tsx
│   │   │   │   └── sifre-sifirla/page.tsx
│   │   │   ├── firma/
│   │   │   │   ├── page.tsx          ← Firma listesi
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx      ← Firma detay
│   │   │   │       └── layout.tsx
│   │   │   ├── memnuniyet/
│   │   │   │   ├── yaz/page.tsx      ← Yorum yaz
│   │   │   │   └── [slug]/page.tsx   ← Yorum detay
│   │   │   ├── kategori/
│   │   │   │   ├── page.tsx          ← Kategoriler
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── en-iyi-firmalar/page.tsx
│   │   │   ├── trend/page.tsx
│   │   │   ├── etiket/[slug]/page.tsx
│   │   │   ├── profil/
│   │   │   │   ├── page.tsx          ← Kendi profilim
│   │   │   │   └── [username]/page.tsx
│   │   │   ├── [slug]/page.tsx       ← Statik sayfalar (hakkimizda, kvkk)
│   │   │   ├── arama/page.tsx
│   │   │   ├── sitemap.xml/route.ts
│   │   │   └── robots.txt/route.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── MobileMenu.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── StatsCounter.tsx
│   │   │   │   ├── TopCompanies.tsx
│   │   │   │   ├── LatestReviews.tsx
│   │   │   │   ├── CategoryGrid.tsx
│   │   │   │   └── CTASection.tsx
│   │   │   ├── company/
│   │   │   │   ├── CompanyCard.tsx
│   │   │   │   ├── CompanyHeader.tsx
│   │   │   │   ├── CompanyStats.tsx
│   │   │   │   ├── CompanyReviewList.tsx
│   │   │   │   └── CompanyResponseBadge.tsx
│   │   │   ├── review/
│   │   │   │   ├── ReviewCard.tsx
│   │   │   │   ├── ReviewForm.tsx
│   │   │   │   ├── ReviewDetail.tsx
│   │   │   │   ├── StarRating.tsx
│   │   │   │   ├── HelpfulButton.tsx
│   │   │   │   └── ImageGallery.tsx
│   │   │   ├── category/
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   └── CategoryTree.tsx
│   │   │   └── ui/                   ← Genel bileşenler
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Pagination.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       ├── Toast.tsx
│   │   │       └── Breadcrumb.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                ← Axios instance
│   │   │   ├── auth.ts               ← Token yönetimi
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSearch.ts
│   │   │   └── useInfiniteScroll.ts
│   │   ├── store/                    ← Zustand
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   └── types/
│   │       ├── company.ts
│   │       ├── review.ts
│   │       ├── user.ts
│   │       └── api.ts
│   ├── public/
│   │   ├── icons/
│   │   └── images/
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
├── admin/                            ← Next.js (Admin Panel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── yorumlar/
│   │   │   │   ├── page.tsx          ← Yorum listesi
│   │   │   │   ├── bekleyen/page.tsx ← Moderasyon kuyruğu
│   │   │   │   └── [id]/page.tsx     ← Yorum detay
│   │   │   ├── firmalar/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── ekle/page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── sahiplenme/page.tsx
│   │   │   ├── kullanicilar/page.tsx
│   │   │   ├── kategoriler/page.tsx
│   │   │   ├── raporlar/page.tsx
│   │   │   ├── sayfalar/page.tsx
│   │   │   └── ayarlar/page.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   ├── AdminHeader.tsx
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   ├── ReviewChart.tsx
│   │   │   │   └── RecentActivity.tsx
│   │   │   └── shared/
│   │   │       ├── DataTable.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   └── ...
│   └── package.json
│
├── CLAUDE.md                         ← Master prompt (aşağıda)
├── .claude/
│   ├── settings.json
│   └── commands/
│       ├── setup.md
│       ├── new-module.md
│       ├── seed-data.md
│       └── deploy.md
├── deploy.sh
├── docker-compose.yml                ← Sadece dev ortamı (PG, Redis, Meilisearch)
└── README.md
```

---

## 7. Claude Code Scaffolding — CLAUDE.md

```markdown
# CLAUDE.md — MemnuniyetimVar

## Proje Özeti
MemnuniyetimVar, Türkiye'nin pozitif müşteri deneyimi platformudur.
Kullanıcılar firmalar hakkında memnuniyetlerini paylaşır, firmalar itibarlarını güçlendirir.
Şikayetvar.com'un tam tersi — teşekkür ve takdir platformu.

## Tech Stack
- **Backend:** NestJS (TypeScript) — REST API
- **Frontend (Public):** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Admin Panel:** Next.js 15 (ayrı proje, Tailwind + shadcn/ui)
- **Veritabanı:** PostgreSQL 16 + TypeORM
- **Arama:** Meilisearch
- **Cache/Queue:** Redis + BullMQ
- **Auth:** JWT + Refresh Token + SMS doğrulama
- **Storage:** S3-compatible (MinIO dev, AWS prod)
- **Deploy:** VPS + Nginx + PM2 + deploy.sh

## Kod Kuralları

### Genel
- TypeScript strict mode
- Her dosya tek sorumluluk
- Fonksiyon/method max 40 satır
- Türkçe yorum satırları kabul, değişken/fonksiyon adları İngilizce
- Her endpoint için DTO (class-validator)
- Her entity için migration (auto-generate yasak)
- Error handling: NestJS built-in exception filters

### NestJS Backend Kuralları
- Her modül: module, controller, service, entity, dto klasörü
- Controller'da iş mantığı OLMAZ, sadece service çağrısı
- Service'te veritabanı sorguları repository pattern ile
- Guard'lar: JwtAuthGuard, RolesGuard, AdminGuard
- Interceptor: TransformInterceptor (response wrapper)
- Pipe: Global ValidationPipe (whitelist: true, transform: true)
- Her endpoint için Swagger decorator (@ApiTags, @ApiOperation, @ApiResponse)
- Rate limiting: @Throttle decorator

### Next.js Frontend Kuralları
- App Router (app/ dizini)
- Server Components varsayılan, client sadece gerektiğinde
- Türkçe URL slug'ları (firma → /firma, memnuniyet → /memnuniyet)
- Metadata API ile SEO (generateMetadata)
- Tailwind CSS, inline style YASAK
- Zustand ile state management
- Axios instance ile API çağrıları (lib/api.ts)
- Loading.tsx ve error.tsx her route group için
- Image optimizasyonu: next/image

### Veritabanı Kuralları
- UUID primary key (users, reviews, companies)
- SERIAL primary key (categories, tags, pages)
- slug alanları UNIQUE index
- Soft delete YOK, gerçek silme + activity log
- Counter cache: review_count, helpful_count direkt entity'de
- JSONB sadece esnek data için (notification.data, log.details)
- Index: slug, status, created_at, user_id, company_id

### URL Yapısı (Türkçe, SEO)
- /firma → firma listesi
- /firma/[slug] → firma detay (ör: /firma/turk-telekom)
- /memnuniyet/yaz → yorum yaz
- /memnuniyet/[slug] → yorum detay
- /kategori → kategori listesi
- /kategori/[slug] → kategori detay
- /en-iyi-firmalar → top firmalar
- /arama?q=... → arama sonuçları
- /giris, /kayit, /sifre-sifirla → auth

### API Response Formatı
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Hata Response Formatı
```json
{
  "success": false,
  "error": {
    "code": "REVIEW_NOT_FOUND",
    "message": "İlgili yorum bulunamadı",
    "statusCode": 404
  }
}
```

## Monorepo Yapısı
```
/backend    → NestJS API (port 4000)
/frontend   → Next.js public site (port 3000)
/admin      → Next.js admin panel (port 3001)
```

## Geliştirme Ortamı
```bash
# Dev servisleri başlat (PostgreSQL, Redis, Meilisearch)
docker-compose up -d

# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev

# Admin
cd admin && npm run dev
```

## Deployment
```bash
# Production deploy
./deploy.sh production
```
- GitHub webhook tetikler
- PM2 ecosystem.config.js ile process yönetimi
- Nginx reverse proxy (frontend:3000, api:4000, admin:3001)
- Let's Encrypt SSL

## Önemli Notlar
- Docker sadece DEV ortamında (PG, Redis, Meilisearch için)
- Production'da direkt kurulum (PM2 + Nginx)
- GitHub Actions YOK, webhook + deploy.sh
- Test: Jest (backend), Playwright (frontend — gelecek faz)
- Firma logoları ve yorum görselleri S3'e yüklenir
- SMS doğrulama: Netgsm veya İleti Merkezi API
- MemnuniyetEndeks: (avg_rating * 0.6) + (response_rate * 0.3) + (review_volume_score * 0.1)
```

---

## 8. Claude Code Settings & Commands

### .claude/settings.json
```json
{
  "permissions": {
    "allow": [
      "bash(npm run *)",
      "bash(npx *)",
      "bash(cd backend && *)",
      "bash(cd frontend && *)",
      "bash(cd admin && *)",
      "bash(docker-compose *)",
      "bash(cat *)",
      "bash(ls *)",
      "bash(mkdir *)",
      "bash(cp *)",
      "bash(mv *)",
      "bash(find *)",
      "bash(grep *)",
      "bash(wc *)",
      "bash(head *)",
      "bash(tail *)"
    ],
    "deny": [
      "bash(rm -rf /)",
      "bash(sudo *)",
      "bash(chmod 777 *)"
    ]
  }
}
```

### .claude/commands/setup.md
```markdown
# Proje Kurulumu

Tüm bağımlılıkları kur ve geliştirme ortamını hazırla:

1. Backend bağımlılıkları: `cd backend && npm install`
2. Frontend bağımlılıkları: `cd frontend && npm install`
3. Admin bağımlılıkları: `cd admin && npm install`
4. Docker servisleri: `docker-compose up -d`
5. Migration çalıştır: `cd backend && npm run migration:run`
6. Seed data: `cd backend && npm run seed`
7. Meilisearch index oluştur: `cd backend && npm run search:index`
```

### .claude/commands/new-module.md
```markdown
# Yeni NestJS Modülü Oluştur

$ARGUMENTS değişkenini modül adı olarak kullan.

1. `cd backend && npx nest generate module modules/$ARGUMENTS`
2. `npx nest generate controller modules/$ARGUMENTS`
3. `npx nest generate service modules/$ARGUMENTS`
4. Entity dosyası oluştur: `src/modules/$ARGUMENTS/entities/`
5. DTO dosyaları oluştur: `src/modules/$ARGUMENTS/dto/`
6. AppModule'e import et
7. Swagger tag'i ekle
```

### .claude/commands/deploy.md
```markdown
# Deploy Kontrol Listesi

1. `cd backend && npm run build` — Backend derleme
2. `cd frontend && npm run build` — Frontend derleme
3. `cd admin && npm run build` — Admin derleme
4. Migration kontrolü: `cd backend && npm run migration:show`
5. Env değişkenleri kontrol et
6. `./deploy.sh production` çalıştır
```

---

## 9. UI/UX Wireframe Fikirleri

### 9.1 Anasayfa Yapısı (şikayetvar benzeri ama pozitif)

```
┌──────────────────────────────────────────────────┐
│  [Logo] MemnuniyetimVar    [Arama]  [Giriş/Kayıt]│
│  Kategoriler ▼  En İyi Firmalar  Trend           │
├──────────────────────────────────────────────────┤
│                                                  │
│   ████████████████████████████████████████████   │
│   █                                          █   │
│   █   "Teşekkür etmek için bir neden var!"   █   │
│   █                                          █   │
│   █   [Firma ara veya memnuniyetini paylaş]  █   │
│   █   ________________________________       █   │
│   █   |  Firma adı yazın...    🔍     |      █   │
│   █   ________________________________       █   │
│   █                                          █   │
│   █   13M+ Üye  |  250K+ Firma  |  5M+ Yorum█   │
│   █                                          █   │
│   ████████████████████████████████████████████   │
│                                                  │
├──────────────────────────────────────────────────┤
│  📂 Popüler Kategoriler                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ 🛒     │ │ 📱     │ │ ✈️     │ │ 🏦     │   │
│  │E-Ticaret│ │Telekom │ │Seyahat │ │ Banka  │   │
│  │ 1.2K   │ │  980   │ │  650   │ │  540   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ 🚗     │ │ 🍔     │ │ 🏥     │ │ 📦     │   │
│  │Otomotiv│ │ Yemek  │ │Sağlık  │ │ Kargo  │   │
│  │  420   │ │  380   │ │  310   │ │  670   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                  │
├──────────────────────────────────────────────────┤
│  ⭐ En Çok Teşekkür Edilen Firmalar             │
│  ┌──────────────────┐ ┌──────────────────┐      │
│  │ [Logo] Trendyol  │ │ [Logo] Hepsiburada│      │
│  │ ⭐ 4.7 · 12.5K   │ │ ⭐ 4.5 · 9.8K    │      │
│  │ MemnuniyetEndeks:│ │ MemnuniyetEndeks:│      │
│  │ ██████████░ 92   │ │ █████████░░ 87   │      │
│  └──────────────────┘ └──────────────────┘      │
│                                                  │
├──────────────────────────────────────────────────┤
│  💬 Son Memnuniyetler                            │
│  ┌──────────────────────────────────────────┐   │
│  │ 👤 Ahmet Y. → Trendyol    ⭐⭐⭐⭐⭐  2s   │
│  │ "Siparişim çok hızlı geldi, paketleme..."│   │
│  │ 👍 24 kişi faydalı buldu                  │   │
│  ├──────────────────────────────────────────┤   │
│  │ 👤 Elif K. → Türk Telekom  ⭐⭐⭐⭐   15d  │   │
│  │ "İnternet hız sorunu 1 günde çözüldü..." │   │
│  │ 👍 18 kişi faydalı buldu                  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Memnuniyetini Paylaş — Hemen Yaz!]  CTA Buton │
│                                                  │
├──────────────────────────────────────────────────┤
│  Footer: Hakkımızda | KVKK | İletişim | SSS     │
│  © 2026 MemnuniyetimVar — Tüm hakları saklıdır  │
└──────────────────────────────────────────────────┘
```

### 9.2 Firma Detay Sayfası

```
┌──────────────────────────────────────────────────┐
│  Breadcrumb: Ana Sayfa > E-Ticaret > Trendyol    │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Logo]  TRENDYOL                    ✅ Doğrulanmış│
│          ⭐ 4.7 / 5  (12,543 değerlendirme)      │
│          📍 İstanbul | 🌐 trendyol.com           │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ MemnuniyetEndeks: 92/100               │    │
│  │ █████████████████████████████░░░        │    │
│  │                                         │    │
│  │ Yanıt Oranı: %87  |  Ort. Yanıt: 2 gün│    │
│  │ Bu ay: 234 teşekkür                     │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  [Memnuniyetini Paylaş]  [Firmayı Karşılaştır]  │
│                                                  │
├──────────────────────────────────────────────────┤
│  Filtre: [Tümü] [5⭐] [4⭐] [3⭐]  Sırala: ▼    │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ ⭐⭐⭐⭐⭐  "Harika müşteri hizmetleri!"    │   │
│  │ 👤 Mehmet A. · 3 saat önce               │   │
│  │                                          │   │
│  │ Kargo çok hızlı geldi, paketleme özenli  │   │
│  │ İade sürecinde hiç sorun yaşamadım...     │   │
│  │                                          │   │
│  │ 📸 [img1] [img2]                         │   │
│  │ 🏷️ #hızlıkargo #müşteriHizmetleri        │   │
│  │                                          │   │
│  │ 👍 24 Faydalı  |  💬 Firma Yanıtladı ✅  │   │
│  │ ┌── Firma Yanıtı ──────────────────┐     │   │
│  │ │ Değerli müşterimiz, teşekkür...  │     │   │
│  │ └──────────────────────────────────┘     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [1] [2] [3] ... [45] Sonraki →                  │
└──────────────────────────────────────────────────┘
```

### 9.3 Admin Panel Dashboard

```
┌──────────────────────────────────────────────────┐
│  [☰] MemnuniyetimVar Admin     👤 Admin Adı [▼]  │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  📊 Dashboard│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  💬 Yorumlar │  │ 156 │ │ 23  │ │ 4.2K│ │ 89% ││
│    Bekleyen  │  │Bugün│ │Bekl.│ │ Üye │ │Yanıt││
│    Onaylanan │  └─────┘ └─────┘ └─────┘ └─────┘│
│    Reddedilen│                                   │
│  🏢 Firmalar │  ┌─── Haftalık Yorum Grafiği ───┐│
│    Liste     │  │  ▂▃▅▇█▇▅▃▂▃▅▇                ││
│    Sahiplenme│  │  Pzt Sal Çar Per Cum Cmt Paz  ││
│  👥 Kullanıcı│  └───────────────────────────────┘│
│  📁 Kategoriler                                   │
│  🚩 Raporlar │  ┌─── Son Bekleyen Yorumlar ────┐│
│  📄 Sayfalar │  │ ○ Ahmet → Trendyol  [Onayla] ││
│  ⚙️ Ayarlar  │  │ ○ Elif → Getir     [Onayla]  ││
│            │  │ ○ Can → THY        [İncele]  ││
│            │  └───────────────────────────────┘│
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

### 9.4 Tasarım Yönergeleri

**Renk Paleti (Pozitif, güven veren):**
- Primary: #10B981 (Emerald Green — teşekkür, pozitiflik)
- Secondary: #3B82F6 (Blue — güven)
- Accent: #F59E0B (Amber — yıldız, ödül)
- Background: #F9FAFB (Light gray)
- Text: #111827 (Near black)
- Success: #059669
- Warning: #D97706
- Error: #DC2626

**Tipografi:**
- Display: "Plus Jakarta Sans" veya "Outfit"
- Body: "Inter" veya "DM Sans"
- Monospace (admin): "JetBrains Mono"

**Tasarım İlkeleri:**
1. Şikayetvar'ın layout yapısı referans alınsın ama renk ve ton tamamen pozitif olsun
2. Yeşil tonları (güven, teşekkür) ağırlıklı, kırmızı minimum
3. Yıldız rating sistemi altın/amber renk
4. Firma kartlarında MemnuniyetEndeks bar göstergesi
5. "Doğrulanmış" firma badge'i güven artırır
6. Mobile-first responsive tasarım
7. Skeleton loading (kullanıcı deneyimi)
8. Micro-animation (faydalı butonu tıklama, yıldız seçimi)
9. Breadcrumb her sayfada (SEO + UX)
10. Dark mode desteği (gelecek faz)

---

## 10. Gelir Modeli Önerileri (Gelecek Fazlar)

1. **Firma Pro Üyelik:** Öne çıkan profil, detaylı analitik, CRM entegrasyonu
2. **Promoted Firma:** Kategoride üst sırada görünme
3. **MemnuniyetEndeks Sertifikası:** "En İyi Müşteri Deneyimi" rozeti
4. **API Erişimi:** Firmaların kendi sistemlerine entegrasyon
5. **Reklam:** Banner reklam (non-intrusive)
6. **Anket Hizmeti:** Firmalar adına müşteri memnuniyeti anketi

---

## 11. Başlangıç Seed Kategorileri

```
├── E-Ticaret
│   ├── Online Mağazalar
│   ├── Pazar Yerleri
│   └── Abonelik Kutuları
├── Telekomünikasyon
│   ├── GSM Operatörleri
│   ├── İnternet Sağlayıcıları
│   └── Kablo TV
├── Bankacılık & Finans
│   ├── Bankalar
│   ├── Sigorta
│   └── Yatırım
├── Seyahat & Konaklama
│   ├── Havayolları
│   ├── Oteller
│   └── Tur Operatörleri
├── Yemek & İçecek
│   ├── Restoranlar
│   ├── Online Yemek Sipariş
│   └── Kafe & Pastane
├── Otomotiv
│   ├── Otomobil Markaları
│   ├── Servisler
│   └── Kiralama
├── Kargo & Lojistik
│   ├── Kargo Firmaları
│   ├── Kurye
│   └── Depolama
├── Sağlık
│   ├── Hastaneler
│   ├── Eczaneler
│   └── Sigorta
├── Eğitim
│   ├── Online Eğitim
│   ├── Dil Kursları
│   └── Üniversiteler
└── Teknoloji & Elektronik
    ├── Bilgisayar
    ├── Telefon & Aksesuar
    └── Beyaz Eşya
```
