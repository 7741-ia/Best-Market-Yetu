export const PROVINCES = [
  {
    name: 'Kinshasa',
    cities: ['Gombe', 'Lingwala', 'Kintambo', 'Barumbu', 'Kinshasa', 'Kalamu', 'Kasa-Vubu', 'Ngiri-Ngiri', 'Bandalungwa', 'Lemba', 'Ngaba', 'Makala', 'Bumbu', 'Selembao', 'Ngaliema', 'Mont-Ngafula', 'Kisenso', 'Matete', 'Ndjili', 'Kimbanseke', 'Masina', 'Maluku', 'Nsele', 'Kinkole'],
  },
  { name: 'Kongo Central', cities: ['Matadi', 'Boma', 'Kisantu', 'Mbanza-Ngungu', 'Lukala', 'Kasangulu', 'Moanda', 'Tshela'] },
  { name: 'Kwango', cities: ['Kenge', 'Popokabaka', 'Feshi', 'Kahemba', 'Kasongo-Lunda'] },
  { name: 'Kwilu', cities: ['Bandundu', 'Kikwit', 'Bulungu', 'Gungu', 'Idiofa', 'Bagata'] },
  { name: 'Mai-Ndombe', cities: ['Inongo', 'Kutu', 'Kiri', 'Mushie', 'Bolobo', 'Oshwe'] },
  { name: 'Équateur', cities: ['Mbandaka', 'Bikoro', 'Lukolela', 'Basankusu', 'Bomongo'] },
  { name: 'Tshuapa', cities: ['Boende', 'Monkoto', 'Ikela', 'Befale', 'Djolu'] },
  { name: 'Mongala', cities: ['Lisala', 'Bumba', 'Bongandanga'] },
  { name: 'Nord-Ubangi', cities: ['Gbadolite', 'Bosobolo', 'Yakoma', 'Mobayi-Mbongo'] },
  { name: 'Sud-Ubangi', cities: ['Gemena', 'Libenge', 'Zongo', 'Budjala'] },
  { name: 'Tshopo', cities: ['Kisangani', 'Isangi', 'Ubundu', 'Banalia', 'Basoko', 'Opala'] },
  { name: 'Bas-Uele', cities: ['Buta', 'Aketi', 'Bondo', 'Ango'] },
  { name: 'Haut-Uele', cities: ['Isiro', 'Wamba', 'Watsa', 'Dungu', 'Faradje'] },
  { name: 'Ituri', cities: ['Bunia', 'Aru', 'Mahagi', 'Mambasa', 'Djugu'] },
  { name: 'Nord-Kivu', cities: ['Goma', 'Beni', 'Butembo', 'Rutshuru', 'Masisi', 'Walikale', 'Nyiragongo'] },
  { name: 'Sud-Kivu', cities: ['Bukavu', 'Uvira', 'Baraka', 'Kamituga', 'Kalehe', 'Walungu', 'Shabunda', 'Fizi', 'Idjwi'] },
  { name: 'Maniema', cities: ['Kindu', 'Kasongo', 'Kibombo', 'Punia', 'Lubutu'] },
  { name: 'Sankuru', cities: ['Lusambo', 'Lodja', 'Lubefu', 'Kole', 'Katako-Kombe'] },
  { name: 'Kasaï', cities: ['Tshikapa', 'Ilebo', 'Mweka', 'Luebo', 'Dekese'] },
  { name: 'Kasaï-Central', cities: ['Kananga', 'Demba', 'Dibaya', 'Kazumba', 'Dimbelenge'] },
  { name: 'Kasaï-Oriental', cities: ['Mbuji-Mayi', 'Miabi', 'Tshilenge', 'Kasansa', 'Kabeya-Kamwanga'] },
  { name: 'Lomami', cities: ['Kabinda', 'Mwene-Ditu', 'Ngandajika', 'Luputa', 'Lubao'] },
  { name: 'Haut-Lomami', cities: ['Kamina', 'Bukama', 'Kaniama', 'Malemba-Nkulu'] },
  { name: 'Lualaba', cities: ['Kolwezi', 'Dilolo', 'Kapanga', 'Sandoa', 'Mutshatsha'] },
  { name: 'Haut-Katanga', cities: ['Lubumbashi', 'Likasi', 'Kipushi', 'Kambove', 'Kasumbalesa', 'Sakania'] },
  { name: 'Tanganyika', cities: ['Kalemie', 'Kongolo', 'Manono', 'Moba', 'Nyunzu'] },
]

export const ADMIN_PHONE = '243859886065'
export const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'best_king'
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Liondudesert774'

export function citiesOf(province) {
  return PROVINCES.find((p) => p.name === province)?.cities || []
}

export function allCityOptions() {
  return PROVINCES.flatMap((p) => p.cities.map((city) => ({ province: p.name, city })))
}

export function kmBetween(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10
}

export function mapEmbed(lat, lng) {
  const d = 0.04
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function readGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS indisponible'))
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => reject(new Error('Permission GPS refusée')),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  })
}
