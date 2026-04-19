import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { seedCategories } from './category.seed';
import { generateSlug, generateUniqueSlug } from '../../common/utils/slug.util';

dotenv.config();

const USERS = [
  { full_name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '+905551000001' },
  { full_name: 'Elif Kaya', email: 'elif@example.com', phone: '+905551000002' },
  { full_name: 'Mehmet Demir', email: 'mehmet@example.com', phone: '+905551000003' },
  { full_name: 'Zeynep Arslan', email: 'zeynep@example.com', phone: '+905551000004' },
  { full_name: 'Can Bakır', email: 'can@example.com', phone: '+905551000005' },
  { full_name: 'Selin Toprak', email: 'selin@example.com', phone: '+905551000006' },
  { full_name: 'Burak Şahin', email: 'burak@example.com', phone: '+905551000007' },
  { full_name: 'Ayşe Çelik', email: 'ayse@example.com', phone: '+905551000008' },
  { full_name: 'Emre Koç', email: 'emre@example.com', phone: '+905551000009' },
  { full_name: 'Deniz Aydın', email: 'deniz@example.com', phone: '+905551000010' },
  { full_name: 'Fatma Öztürk', email: 'fatma@example.com', phone: '+905551000011' },
  { full_name: 'Mustafa Erdoğan', email: 'mustafa@example.com', phone: '+905551000012' },
];

const COMPANIES = [
  { name: 'Trendyol', city: 'İstanbul', district: 'Maslak', website: 'trendyol.com', description: 'Türkiye\'nin en büyük e-ticaret platformu.', catSlug: 'e-ticaret' },
  { name: 'Hepsiburada', city: 'İstanbul', district: 'Ataşehir', website: 'hepsiburada.com', description: 'Türkiye\'nin öncü e-ticaret sitesi.', catSlug: 'e-ticaret' },
  { name: 'Getir', city: 'İstanbul', district: 'Levent', website: 'getir.com', description: 'Dakikalar içinde kapınıza teslimat.', catSlug: 'online-yemek-siparis' },
  { name: 'Türk Hava Yolları', city: 'İstanbul', district: 'Yeşilköy', website: 'turkishairlines.com', description: 'En fazla ülkeye uçan havayolu.', catSlug: 'havayollari' },
  { name: 'Türk Telekom', city: 'Ankara', district: 'Çankaya', website: 'turktelekom.com.tr', description: 'Fiber internet ve iletişim hizmetleri.', catSlug: 'internet-saglayicilari' },
  { name: 'A101', city: 'İstanbul', district: 'Bağcılar', website: 'a101.com.tr', description: 'Uygun fiyat, kaliteli ürün garantisi.', catSlug: 'e-ticaret' },
  { name: 'Migros', city: 'İstanbul', district: 'Ataşehir', website: 'migros.com.tr', description: 'Türkiye\'nin lider süpermarket zinciri.', catSlug: 'e-ticaret' },
  { name: 'BİM', city: 'İstanbul', district: 'Esenler', website: 'bim.com.tr', description: 'Her gün düşük fiyat garantisi.', catSlug: 'e-ticaret' },
  { name: 'Turkcell', city: 'İstanbul', district: 'Maltepe', website: 'turkcell.com.tr', description: 'Türkiye\'nin lider dijital operatörü.', catSlug: 'gsm-operatorleri' },
  { name: 'Vodafone', city: 'İstanbul', district: 'Beşiktaş', website: 'vodafone.com.tr', description: 'Global iletişim, mobil ve internet.', catSlug: 'gsm-operatorleri' },
  { name: 'Yemeksepeti', city: 'İstanbul', district: 'Şişli', website: 'yemeksepeti.com', description: 'Online yemek sipariş platformu.', catSlug: 'online-yemek-siparis' },
  { name: 'Garanti BBVA', city: 'İstanbul', district: 'Levent', website: 'garantibbva.com.tr', description: 'Bireysel ve kurumsal bankacılık.', catSlug: 'bankalar' },
  { name: 'İş Bankası', city: 'İstanbul', district: 'Şişli', website: 'isbank.com.tr', description: '100 yılı aşkın güven ve deneyim.', catSlug: 'bankalar' },
  { name: 'LC Waikiki', city: 'İstanbul', district: 'Avcılar', website: 'lcwaikiki.com', description: 'Herkes için ulaşılabilir moda.', catSlug: 'e-ticaret' },
  { name: 'Pegasus', city: 'İstanbul', district: 'Kurtköy', website: 'flypgs.com', description: 'Uygun fiyatlı uçuşlar.', catSlug: 'havayollari' },
  { name: 'Aras Kargo', city: 'İstanbul', district: 'Tuzla', website: 'araskargo.com.tr', description: 'Hızlı ve güvenli teslimat.', catSlug: 'kargo-firmalari' },
  { name: 'Yurtiçi Kargo', city: 'İstanbul', district: 'Hadımköy', website: 'yurticikargo.com', description: 'Geniş ağ, güvenilir hizmet.', catSlug: 'kargo-firmalari' },
  { name: 'Sahibinden.com', city: 'İstanbul', district: 'Maslak', website: 'sahibinden.com', description: 'Türkiye\'nin en büyük ilan sitesi.', catSlug: 'pazar-yerleri' },
  { name: 'N11', city: 'İstanbul', district: 'Şişli', website: 'n11.com', description: 'Binlerce mağaza, milyonlarca ürün.', catSlug: 'pazar-yerleri' },
  { name: 'Decathlon', city: 'İstanbul', district: 'Maltepe', website: 'decathlon.com.tr', description: 'Spor malzemeleri ve ekipmanları.', catSlug: 'e-ticaret' },
];

const REVIEWS = [
  { title: 'Kargo çok hızlı geldi, paketleme mükemmeldi', content: 'Siparişimi verdikten sadece 1 gün sonra elime ulaştı. Ürün özenle paketlenmişti, hiçbir hasar yoktu. Müşteri hizmetleri de çok ilgiliydi. Kesinlikle tekrar alışveriş yapacağım.', rating: 5 },
  { title: 'Müşteri hizmetleri sorunumu anında çözdü', content: 'Yaşadığım problemle ilgili müşteri hizmetlerini aradım. Bekleme süresi çok kısaydı ve temsilci son derece yardımcı oldu. Sorunum 5 dakika içinde çözüldü.', rating: 5 },
  { title: 'Fiyat-performans oranı harika', content: 'Aldığım ürün beklediğimden çok daha kaliteli çıktı. Bu fiyata bu kaliteyi başka yerde bulamam. Kampanyalar da çok avantajlı. Herkese tavsiye ederim.', rating: 5 },
  { title: 'İade süreci sorunsuz tamamlandı', content: 'Beğenmediğim ürünü iade ettim. Online iade talebimi oluşturduktan sonra kargo 2 gün içinde geldi. Param 3 iş günü içinde hesabıma yatırıldı.', rating: 4 },
  { title: 'Ürün kalitesi beklentilerimin üzerinde', content: 'İnternetten alışveriş yaparken kalite konusunda endişelenirdim ama bu deneyim beni çok mutlu etti. Ürün fotoğraftakiyle birebir aynı.', rating: 5 },
  { title: 'Teslimat süresi çok iyi', content: 'Aynı gün kargo seçeneğini kullandım ve gerçekten aynı gün içinde siparişim elime ulaştı. Hızlı teslimat hizmeti takdire şayan.', rating: 5 },
  { title: 'Mobil uygulama çok kullanışlı', content: 'Mobil uygulamayı indirdim ve alışveriş deneyimim çok daha kolay hale geldi. Arayüz sade ve anlaşılır, ödeme tek tıkla yapılıyor.', rating: 4 },
  { title: 'Kampanyalar gerçekten avantajlı', content: 'Sezon sonu indirimlerinde inanılmaz fiyatlar yakaladım. İndirim kuponları ve cashback kampanyaları da cabası.', rating: 4 },
  { title: 'Mağaza personeli çok güler yüzlü', content: 'Fiziksel mağazayı ziyaret ettim, personel çok ilgili ve yardımcıydı. Alternatif öneriler sundular. Kendimi çok rahat hissettim.', rating: 5 },
  { title: 'Online deneyim mükemmeldi', content: 'Web sitesi çok hızlı ve kullanıcı dostu. Ürün arama, filtreleme ve karşılaştırma özellikleri çok işlevsel.', rating: 5 },
  { title: 'Garanti süreci sorunsuz işledi', content: 'Garanti kapsamındaki sorunum 1 hafta içinde çözüldü. Ücretsiz yedek parça değişimi ve profesyonel servis hizmeti aldım.', rating: 4 },
  { title: 'Hizmet kalitesi her zaman üst düzey', content: 'Yıllardır müşteriyim ve hizmet kalitesinden hiç şikayetçi olmadım. Her seferinde aynı özen ve profesyonelliği görüyorum.', rating: 5 },
  { title: 'Çağrı merkezi çok profesyonel', content: 'Çağrı merkezini aradım, beklemeden bağlandım. Temsilci profesyoneldi, sorunumu dinledi ve 24 saat içinde çözdü.', rating: 4 },
  { title: 'Sosyal medya desteği harika', content: 'Twitter üzerinden yazdığım mesaja 15 dakika içinde yanıt geldi. DM üzerinden süreci takip ettiler ve sorunumu çözdüler.', rating: 4 },
  { title: 'Premium üyelik çok değerli', content: 'Premium üyelik aldım ve çok memnun kaldım. Ücretsiz kargo, öncelikli destek ve özel indirimler. Aylık ücreti fazlasıyla hak ediyor.', rating: 5 },
];

const TAGS = [
  'hızlı kargo', 'müşteri hizmetleri', 'kaliteli ürün', 'uygun fiyat',
  'güler yüzlü personel', 'kolay iade', 'hızlı teslimat', 'güvenilir',
  'kampanyalı', 'mobil uygulama', 'profesyonel hizmet', 'tavsiye ederim',
];

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'memnuniyetimvar',
    password: process.env.DB_PASSWORD || 'memnuniyetimvar_dev',
    database: process.env.DB_NAME || 'memnuniyetimvar',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Database connected.');

  // 1. Categories
  await seedCategories(dataSource);

  // 2. Admin
  const adminRepo = dataSource.getRepository('AdminUser');
  if ((await adminRepo.count()) === 0) {
    await adminRepo.save({
      email: 'admin@memnuniyetimvar.com',
      password_hash: await bcrypt.hash('Admin123!', 12),
      full_name: 'Super Admin',
      role: 'super_admin',
    });
    console.log('Admin user created.');
  }

  // 3. Tags
  const tagRepo = dataSource.getRepository('Tag');
  let savedTags: any[] = [];
  if ((await tagRepo.count()) === 0) {
    for (const name of TAGS) {
      savedTags.push(await tagRepo.save({ name, slug: generateSlug(name), usageCount: 0 }));
    }
    console.log(`Seeded ${TAGS.length} tags.`);
  } else {
    savedTags = await tagRepo.find();
  }

  // 4. Users
  const userRepo = dataSource.getRepository('User');
  let savedUsers: any[] = [];
  if ((await userRepo.count()) === 0) {
    const hash = await bcrypt.hash('User123!', 12);
    for (const u of USERS) {
      savedUsers.push(await userRepo.save({
        full_name: u.full_name, email: u.email, phone: u.phone,
        password_hash: hash, is_phone_verified: true, is_email_verified: true,
        role: 'user', status: 'active', review_count: 0, helpful_count: 0,
      }));
    }
    console.log(`Seeded ${USERS.length} users.`);
  } else {
    savedUsers = await userRepo.find();
  }

  // 5. Companies
  const companyRepo = dataSource.getRepository('Company');
  const categoryRepo = dataSource.getRepository('Category');
  let savedCompanies: any[] = [];
  if ((await companyRepo.count()) === 0) {
    for (const c of COMPANIES) {
      const cat = await categoryRepo.findOne({ where: { slug: c.catSlug } });
      savedCompanies.push(await companyRepo.save({
        name: c.name, slug: generateSlug(c.name), description: c.description,
        website: c.website, city: c.city, district: c.district,
        status: 'active', isVerified: Math.random() > 0.3, isClaimed: Math.random() > 0.5,
        avgRating: 0, reviewCount: 0, responseCount: 0, responseRate: 0,
        memnuniyetScore: 0, categoryId: cat?.id || null,
      }));
    }
    console.log(`Seeded ${COMPANIES.length} companies.`);
  } else {
    savedCompanies = await companyRepo.find();
  }

  // 6. Reviews
  const reviewRepo = dataSource.getRepository('Review');
  if ((await reviewRepo.count()) === 0) {
    const reviewTagRepo = dataSource.getRepository('ReviewTag');
    let total = 0;

    for (const company of savedCompanies) {
      const count = 3 + Math.floor(Math.random() * 8);
      let ratingSum = 0;

      for (let i = 0; i < count; i++) {
        const t = REVIEWS[Math.floor(Math.random() * REVIEWS.length)];
        const u = savedUsers[Math.floor(Math.random() * savedUsers.length)];
        const daysAgo = Math.floor(Math.random() * 90);
        const created = new Date(); created.setDate(created.getDate() - daysAgo);

        const review = await reviewRepo.save({
          userId: u.id, companyId: company.id,
          title: t.title, content: t.content, rating: t.rating,
          status: 'published', isFeatured: Math.random() > 0.85,
          viewCount: Math.floor(Math.random() * 50000),
          helpfulCount: Math.floor(Math.random() * 200),
          slug: generateUniqueSlug(t.title),
          publishedAt: created, createdAt: created,
        });
        ratingSum += t.rating;

        // Random tags
        const shuffled = [...savedTags].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
        for (const tag of shuffled) {
          try { await reviewTagRepo.save({ reviewId: review.id, tagId: tag.id }); } catch { /* dup */ }
        }
        total++;
      }

      // Update company stats
      const avg = parseFloat((ratingSum / count).toFixed(2));
      const rr = Math.floor(50 + Math.random() * 50);
      const vs = Math.min(count / 10, 1) * 100;
      const ms = parseFloat((avg / 5 * 100 * 0.6 + rr * 0.3 + vs * 0.1).toFixed(2));
      await companyRepo.update(company.id, { avgRating: avg, reviewCount: count, responseRate: rr, memnuniyetScore: ms });
    }

    // Update user review counts
    for (const u of savedUsers) {
      const c = await reviewRepo.count({ where: { userId: u.id } });
      await userRepo.update(u.id, { review_count: c });
    }

    // Update tag usage counts
    const rtRepo = dataSource.getRepository('ReviewTag');
    for (const tag of savedTags) {
      const c = await rtRepo.count({ where: { tagId: tag.id } });
      await tagRepo.update(tag.id, { usageCount: c });
    }

    // Update category review counts
    for (const cat of await categoryRepo.find()) {
      const comps = await companyRepo.find({ where: { categoryId: cat.id } });
      const sum = comps.reduce((s: number, c: any) => s + (c.reviewCount || 0), 0);
      await categoryRepo.update(cat.id, { reviewCount: sum });
    }

    console.log(`Seeded ${total} reviews across ${savedCompanies.length} companies.`);
  }

  await dataSource.destroy();
  console.log('Seed completed!');
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
