import slugify from 'slugify';

const turkishCharMap: Record<string, string> = {
  ç: 'c', Ç: 'C',
  ğ: 'g', Ğ: 'G',
  ı: 'i', İ: 'I',
  ö: 'o', Ö: 'O',
  ş: 's', Ş: 'S',
  ü: 'u', Ü: 'U',
};

export function generateSlug(text: string): string {
  let normalized = text;
  for (const [turkishChar, replacement] of Object.entries(turkishCharMap)) {
    normalized = normalized.split(turkishChar).join(replacement);
  }

  return slugify(normalized, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function generateUniqueSlug(text: string): string {
  const base = generateSlug(text);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}
