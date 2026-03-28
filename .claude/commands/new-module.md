# Yeni NestJS Modülü Oluştur

$ARGUMENTS değişkenini modül adı olarak kullan.

1. `cd backend && npx nest generate module modules/$ARGUMENTS`
2. `npx nest generate controller modules/$ARGUMENTS`
3. `npx nest generate service modules/$ARGUMENTS`
4. Entity dosyası oluştur: `src/modules/$ARGUMENTS/entities/`
5. DTO dosyaları oluştur: `src/modules/$ARGUMENTS/dto/`
6. AppModule'e import et
7. Swagger tag'i ekle
