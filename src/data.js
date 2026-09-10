export const CATEGORIES = [
  { id: 'all', label: 'Tout', emoji: '✨' },
  { id: 'souliers', label: 'Souliers', emoji: '👟' },
  { id: 'parfums', label: 'Parfums', emoji: '🧴' },
  { id: 'mode', label: 'Mode', emoji: '👗' },
  { id: 'beaute', label: 'Beauté', emoji: '💄' },
  { id: 'accessoires', label: 'Accessoires', emoji: '⌚' },
]

export const USD_TO_CDF = 2800

export const SHOPS = [
  {
    id: 'kicks-gombe',
    name: 'Kicks Gombe',
    province: 'Kinshasa',
    city: 'Gombe',
    lat: -4.305,
    lng: 15.303,
    tauxCdfPerUsd: 2800,
    trusted: true,
    money: { airtel: '', mpesa: '', orange: '' },
    bio: 'Sneakers neuves et presque neuves. Livraison Gombe, Lingwala, Kintambo.',
    whatsapp: '243810000001',
    photo:
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80',
    cover:
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    id: 'parfum-sika',
    name: 'Parfum Ya Sika',
    province: 'Kinshasa',
    city: 'Lemba',
    lat: -4.392,
    lng: 15.322,
    tauxCdfPerUsd: 2850,
    trusted: true,
    money: { airtel: '', mpesa: '', orange: '' },
    bio: 'Parfums arabes et originaux. Sentir avant d’acheter — on discute sur WhatsApp.',
    whatsapp: '243810000002',
    photo:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80',
    cover:
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    id: 'mama-style',
    name: 'Mama Style',
    province: 'Haut-Katanga',
    city: 'Lubumbashi',
    lat: -11.664,
    lng: 27.479,
    tauxCdfPerUsd: 2900,
    trusted: false,
    money: { airtel: '', mpesa: '', orange: '' },
    bio: 'Mode femme, sacs et looks pour sorties. Pas de boutique physique — tout en ligne.',
    whatsapp: '243970000003',
    photo:
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&q=80',
    cover:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    id: 'gold-wrist',
    name: 'Gold Wrist',
    province: 'Nord-Kivu',
    city: 'Goma',
    lat: -1.679,
    lng: 29.223,
    tauxCdfPerUsd: 3000,
    trusted: false,
    money: { airtel: '', mpesa: '', orange: '' },
    bio: 'Montres et bijoux. Paiement à confirmer sur WhatsApp (cash ou Mobile Money).',
    whatsapp: '243990000004',
    photo:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
    cover:
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80',
    featured: false,
  },
]

export const PRODUCTS = [
  {
    id: 'p1',
    shopId: 'kicks-gombe',
    name: 'Jordan 1 High “Chicago”',
    category: 'souliers',
    priceUsd: 85,
    photo:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
    description: 'Pointure 40–44. État 9/10. Photo réelle à la demande.',
    badge: 'Populaire',
    views: 312,
  },
  {
    id: 'p2',
    shopId: 'kicks-gombe',
    name: 'Nike Dunk Low Panda',
    category: 'souliers',
    priceUsd: 72,
    photo:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    description: 'Noir et blanc, neuves dans la boîte. Livraison Kinshasa.',
    badge: 'Nouveau',
    views: 198,
  },
  {
    id: 'p3',
    shopId: 'parfum-sika',
    name: 'Lattafa Yara',
    category: 'parfums',
    priceUsd: 28,
    photo:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
    description: '100 ml. Floral gourmand. Idéal cadeau.',
    badge: 'Coup de cœur',
    views: 441,
  },
  {
    id: 'p4',
    shopId: 'parfum-sika',
    name: 'Sauvage vibe (inspiration)',
    category: 'parfums',
    priceUsd: 22,
    photo:
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
    description: 'Frais, soirée et bureau. Tester au quartier possible.',
    views: 156,
  },
  {
    id: 'p5',
    shopId: 'mama-style',
    name: 'Sac cuir camel',
    category: 'mode',
    priceUsd: 45,
    photo:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    description: 'Porté épaule. Une seule pièce.',
    badge: 'Unique',
    views: 89,
  },
  {
    id: 'p6',
    shopId: 'mama-style',
    name: 'Robe wax soirée',
    category: 'mode',
    priceUsd: 38,
    photo:
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=80',
    description: 'Taille M. Tissu wax, coupe moderne.',
    views: 204,
  },
  {
    id: 'p7',
    shopId: 'gold-wrist',
    name: 'Montre chronographe or',
    category: 'accessoires',
    priceUsd: 55,
    photo:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    description: 'Bracelet acier. Boîte comprise.',
    badge: 'Premium',
    views: 267,
  },
  {
    id: 'p8',
    shopId: 'parfum-sika',
    name: 'Kit gloss & highlighter',
    category: 'beaute',
    priceUsd: 16,
    photo:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    description: '3 teintes. Neuf, scellé.',
    views: 120,
  },
]

export function formatUsd(n) {
  return `$${Number(n).toLocaleString('fr-FR')}`
}

export function shopRate(shop) {
  const n = Number(shop?.tauxCdfPerUsd)
  return n > 0 ? n : USD_TO_CDF
}

export function formatCdf(usd, shop) {
  const cdf = Math.round(Number(usd) * shopRate(shop))
  return `${cdf.toLocaleString('fr-FR')} FC`
}

export function waBuyUrl(shop, product) {
  const phone = String(shop.whatsapp || '').replace(/\D/g, '')
  const text = `Bonjour ${shop.name} 👋\nJe viens de *Best Market Yetu*.\nJe veux acheter : ${product.name}\nPrix : ${formatUsd(product.priceUsd)} (${formatCdf(product.priceUsd, shop)})\nTaux vendeur : 1$ = ${shopRate(shop).toLocaleString('fr-FR')} FC\nOn peut discuter (cash / Airtel Money / M-Pesa / Orange Money) ?`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
