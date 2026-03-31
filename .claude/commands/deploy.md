# Deploy Kontrol Listesi

1. `cd backend && npm run build` — Backend derleme
2. `cd frontend && npm run build` — Frontend derleme
3. `cd admin && npm run build` — Admin derleme
4. Migration kontrolü: `cd backend && npm run migration:show`
5. Env değişkenleri kontrol et
6. `./deploy.sh production` çalıştır
