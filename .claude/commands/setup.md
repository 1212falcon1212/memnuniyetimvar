# Proje Kurulumu

Tüm bağımlılıkları kur ve geliştirme ortamını hazırla:

1. Backend bağımlılıkları: `cd backend && npm install`
2. Frontend bağımlılıkları: `cd frontend && npm install`
3. Admin bağımlılıkları: `cd admin && npm install`
4. Docker servisleri: `docker-compose up -d`
5. Migration çalıştır: `cd backend && npm run migration:run`
6. Seed data: `cd backend && npm run seed`
7. Meilisearch index oluştur: `cd backend && npm run search:index`
