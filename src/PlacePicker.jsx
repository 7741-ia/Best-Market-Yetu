import { useMemo, useState } from 'react'
import { PROVINCES, citiesOf } from './geo'

export default function PlacePicker({
  province,
  city,
  onProvince,
  onCity,
  onSearch,
  searchLabel = 'Chercher',
}) {
  const [q, setQ] = useState('')
  const cities = citiesOf(province)
  const filteredProvinces = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return PROVINCES
    return PROVINCES.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.cities.some((c) => c.toLowerCase().includes(t)),
    )
  }, [q])

  function applySearch(e) {
    e?.preventDefault()
    const t = q.trim().toLowerCase()
    if (!t) {
      onSearch?.({ province, city, q })
      return
    }
    const hitCity = PROVINCES.flatMap((p) =>
      p.cities.map((c) => ({ province: p.name, city: c })),
    ).find((x) => x.city.toLowerCase() === t || x.city.toLowerCase().includes(t))
    const hitProv = PROVINCES.find((p) => p.name.toLowerCase().includes(t))
    if (hitCity) {
      onProvince(hitCity.province)
      onCity(hitCity.city)
    } else if (hitProv) {
      onProvince(hitProv.name)
      onCity('')
    }
    onSearch?.({ province, city, q })
  }

  return (
    <div className="place-picker">
      <label>
        Province
        <select
          value={province}
          onChange={(e) => {
            onProvince(e.target.value)
            onCity('')
          }}
        >
          <option value="">Toutes les provinces</option>
          {filteredProvinces.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ville / commune
        <select value={city} onChange={(e) => onCity(e.target.value)} disabled={!province}>
          <option value="">{province ? 'Toutes les villes' : 'Choisis d’abord la province'}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rechercher
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              applySearch(e)
            }
          }}
          placeholder="Ex. Goma, Kasaï, Matadi…"
        />
      </label>
      <button className="btn btn-gold" type="button" onClick={applySearch}>
        {searchLabel}
      </button>
    </div>
  )
}
