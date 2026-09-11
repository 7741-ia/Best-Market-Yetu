export const CATEGORIES = [
  { id: 'all', label: 'Tout', emoji: '✨' },
  { id: 'souliers', label: 'Souliers', emoji: '👟' },
  { id: 'parfums', label: 'Parfums', emoji: '🧴' },
  { id: 'mode', label: 'Mode', emoji: '👗' },
  { id: 'beaute', label: 'Beauté', emoji: '💄' },
  { id: 'accessoires', label: 'Accessoires', emoji: '⌚' },
]

export const USD_TO_CDF = 2800

// La production démarre sans boutiques ni produits fictifs.
export const SHOPS = []
export const PRODUCTS = []

const PRODUCT_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
]

// Une image de remplacement stable est choisie pour les anciens produits sans photo.
export function productPlaceholder(product) {
  const seed = String(product?.id || product?.name || 'best-market-yetu')
  const index = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) % PRODUCT_PLACEHOLDERS.length
  return PRODUCT_PLACEHOLDERS[index]
}

export function productImage(product) {
  return String(product?.photo || '').trim() || productPlaceholder(product)
}

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
