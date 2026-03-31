import { DataSource } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';
import { generateSlug } from '../../common/utils/slug.util';

interface CategorySeedData {
  name: string;
  icon: string;
  description: string;
  children: { name: string; description: string }[];
}

const CATEGORIES: CategorySeedData[] = [
  {
    name: 'E-Ticaret',
    icon: 'shopping-cart',
    description: 'Online alışveriş platformları ve e-ticaret siteleri',
    children: [
      { name: 'Online Mağazalar', description: 'İnternet üzerinden satış yapan mağazalar' },
      { name: 'Pazar Yerleri', description: 'Çoklu satıcı pazar yeri platformları' },
      { name: 'Abonelik Kutuları', description: 'Aylık abonelik bazlı ürün kutuları' },
    ],
  },
  {
    name: 'Telekomünikasyon',
    icon: 'phone',
    description: 'İletişim ve telekomünikasyon hizmetleri',
    children: [
      { name: 'GSM Operatörleri', description: 'Mobil iletişim operatörleri' },
      { name: 'İnternet Sağlayıcıları', description: 'Sabit internet hizmet sağlayıcıları' },
      { name: 'Kablo TV', description: 'Kablolu ve uydu TV hizmetleri' },
    ],
  },
  {
    name: 'Bankacılık & Finans',
    icon: 'landmark',
    description: 'Bankacılık, sigorta ve finansal hizmetler',
    children: [
      { name: 'Bankalar', description: 'Ticari ve bireysel bankalar' },
      { name: 'Sigorta', description: 'Sigorta şirketleri ve poliçeler' },
      { name: 'Yatırım', description: 'Yatırım ve aracı kurumları' },
    ],
  },
  {
    name: 'Seyahat & Konaklama',
    icon: 'plane',
    description: 'Seyahat, uçuş ve konaklama hizmetleri',
    children: [
      { name: 'Havayolları', description: 'Havayolu şirketleri' },
      { name: 'Oteller', description: 'Otel ve konaklama tesisleri' },
      { name: 'Tur Operatörleri', description: 'Tur düzenleyen firmalar' },
    ],
  },
  {
    name: 'Yemek & İçecek',
    icon: 'utensils',
    description: 'Yemek, restoran ve içecek hizmetleri',
    children: [
      { name: 'Restoranlar', description: 'Restoran ve yemek mekanları' },
      { name: 'Online Yemek Sipariş', description: 'Online yemek sipariş platformları' },
      { name: 'Kafe & Pastane', description: 'Kafeler ve pastaneler' },
    ],
  },
  {
    name: 'Otomotiv',
    icon: 'car',
    description: 'Otomobil markaları, servis ve kiralama hizmetleri',
    children: [
      { name: 'Otomobil Markaları', description: 'Araç üreticileri ve bayileri' },
      { name: 'Servisler', description: 'Araç bakım ve onarım servisleri' },
      { name: 'Kiralama', description: 'Araç kiralama firmaları' },
    ],
  },
  {
    name: 'Kargo & Lojistik',
    icon: 'truck',
    description: 'Kargo, kurye ve lojistik hizmetleri',
    children: [
      { name: 'Kargo Firmaları', description: 'Kargo taşımacılık firmaları' },
      { name: 'Kurye', description: 'Kurye ve hızlı teslimat hizmetleri' },
      { name: 'Depolama', description: 'Depolama ve lojistik çözümleri' },
    ],
  },
  {
    name: 'Sağlık',
    icon: 'heart-pulse',
    description: 'Sağlık hizmetleri ve sağlık kuruluşları',
    children: [
      { name: 'Hastaneler', description: 'Özel ve devlet hastaneleri' },
      { name: 'Eczaneler', description: 'Eczaneler ve ilaç satış noktaları' },
      { name: 'Sağlık Sigortası', description: 'Özel sağlık sigortası şirketleri' },
    ],
  },
  {
    name: 'Eğitim',
    icon: 'graduation-cap',
    description: 'Eğitim kurumları ve öğrenme platformları',
    children: [
      { name: 'Online Eğitim', description: 'Online eğitim platformları' },
      { name: 'Dil Kursları', description: 'Yabancı dil eğitim kursları' },
      { name: 'Üniversiteler', description: 'Üniversiteler ve yüksek öğretim kurumları' },
    ],
  },
  {
    name: 'Teknoloji & Elektronik',
    icon: 'cpu',
    description: 'Teknoloji ürünleri ve elektronik cihazlar',
    children: [
      { name: 'Bilgisayar', description: 'Bilgisayar ve bilişim ürünleri' },
      { name: 'Telefon & Aksesuar', description: 'Cep telefonu ve aksesuarları' },
      { name: 'Beyaz Eşya', description: 'Beyaz eşya ve ev aletleri' },
    ],
  },
];

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepo = dataSource.getRepository(Category);

  const existingCount = await categoryRepo.count();
  if (existingCount > 0) {
    console.log('Categories already seeded, skipping...');
    return;
  }

  for (let i = 0; i < CATEGORIES.length; i++) {
    const data = CATEGORIES[i];

    const parent = categoryRepo.create({
      name: data.name,
      slug: generateSlug(data.name),
      icon: data.icon,
      description: data.description,
      sortOrder: i + 1,
      isActive: true,
      reviewCount: 0,
    });

    const savedParent = await categoryRepo.save(parent);

    for (let j = 0; j < data.children.length; j++) {
      const childData = data.children[j];

      const child = categoryRepo.create({
        name: childData.name,
        slug: generateSlug(childData.name),
        icon: null,
        description: childData.description,
        sortOrder: j + 1,
        isActive: true,
        reviewCount: 0,
        parentId: savedParent.id,
      });

      await categoryRepo.save(child);
    }
  }

  console.log(`Seeded ${CATEGORIES.length} main categories with subcategories.`);
}
