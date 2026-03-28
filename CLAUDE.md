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
docker-compose up -d          # PG, Redis, Meilisearch, MinIO
cd backend && npm run start:dev
cd frontend && npm run dev
cd admin && npm run dev
```

## Deployment
```bash
./deploy.sh production
```
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
