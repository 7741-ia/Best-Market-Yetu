import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES, formatCdf, formatUsd, shopRate, slugify, waBuyUrl } from './data'
import { kmBetween, mapEmbed, readGps } from './geo'
import { StoreProvider, useStore } from './store.jsx'
import PlacePicker from './PlacePicker.jsx'
import AdminPage from './AdminPage.jsx'

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('')
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

function Layout({ children }) {
  const { user } = useStore()
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin_best_king')
  return (
    <div className={`shell ${isAdmin ? 'is-admin' : ''}`}>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">BY</span>
          <span>
            Best Market Yetu
            <small>Ta boutique, sans magasin</small>
          </span>
        </Link>
        {isAdmin ? (
          <span className="ghost">Admin</span>
        ) : (
          <Link className="ghost" to={user ? '/vendre' : '/inscription'}>
            {user ? 'Vendre' : 'Créer ma boutique'}
          </Link>
        )}
      </header>
      {children}
      {isAdmin ? null : (
      <nav className="nav">
        <NavLink to="/" end>
          <b>⌂</b> Accueil
        </NavLink>
        <NavLink to="/favoris">
          <b>♥</b> Favoris
        </NavLink>
        <NavLink to="/vendre">
          <b>+</b> Vendre
        </NavLink>
        <NavLink to={user ? '/compte' : '/connexion'}>
          <b>●</b> Compte
        </NavLink>
      </nav>
      )}
    </div>
  )
}

function ProductCard({ product, shop }) {
  const { favorites, toggleFav } = useStore()
  const loved = favorites.includes(product.id)
  return (
    <article className="card">
      <div className="photo">
        <Link to={`/produit/${product.id}`}>
          <img src={product.photo} alt={product.name} />
        </Link>
        {product.badge ? <span className="badge">{product.badge}</span> : null}
        <button
          type="button"
          className={`heart ${loved ? 'on' : ''}`}
          onClick={() => toggleFav(product.id)}
          aria-label="Favori"
        >
          {loved ? '♥' : '♡'}
        </button>
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
          {shop?.name} · {shop?.city}
          {shop?.trusted ? ' · ✓' : ''}
        </p>
        <p className="price">
          {formatUsd(product.priceUsd)}
          <small>{formatCdf(product.priceUsd, shop)}</small>
        </p>
      </div>
    </article>
  )
}

function Home() {
  const { publicProducts, publicShops } = useStore()
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [here, setHere] = useState(null)
  const [gpsMsg, setGpsMsg] = useState('')

  const list = useMemo(() => {
    return publicProducts
      .filter((p) => {
        const shop = publicShops.find((s) => s.id === p.shopId)
        const okCat = cat === 'all' || p.category === cat
        const okProv = !province || shop?.province === province
        const okCity = !city || shop?.city === city
        const okQ = `${p.name} ${shop?.name} ${shop?.city}`.toLowerCase().includes(q.toLowerCase())
        return shop && okCat && okProv && okCity && okQ
      })
      .sort((a, b) => {
        if (!here) return 0
        const sa = publicShops.find((s) => s.id === a.shopId)
        const sb = publicShops.find((s) => s.id === b.shopId)
        return (kmBetween(here, sa) ?? 9999) - (kmBetween(here, sb) ?? 9999)
      })
  }, [publicProducts, publicShops, cat, city, province, q, here])

  async function nearMe() {
    try {
      const pos = await readGps()
      setHere(pos)
      setGpsMsg('Les plus proches d’abord.')
    } catch (err) {
      setGpsMsg(err.message)
    }
  }

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <h1>Vends tes souliers, parfums et plus — sans boutique.</h1>
          <p className="lead">
            Crée ta vitrine, publie tes produits, et tes clients t’écrivent direct sur WhatsApp.
            Cash, Airtel Money, M-Pesa ou Orange Money : vous vous arrangez ensemble.
          </p>
          <div className="row">
            <Link className="btn btn-gold" to="/inscription">
              Ouvrir ma boutique
            </Link>
            <button className="btn btn-line" type="button" onClick={nearMe}>
              Autour de moi
            </button>
            <a className="btn btn-line" href="#catalogue">
              Voir les produits
            </a>
          </div>
          {gpsMsg ? <p className="muted" style={{ marginTop: 10 }}>{gpsMsg}</p> : null}
        </div>
        <div className="hero-card">
          <img
            src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80"
            alt="Sneakers"
          />
          <span>
            <b>Commande sur WhatsApp</b>
            <br />
            <small>Tu discutes du paiement avec le vendeur.</small>
          </span>
        </div>
      </section>

      <div className="section-head">
        <div>
          <h2>Boutiques en vue</h2>
          <p className="muted">Des jeunes vendeurs, partout en RDC.</p>
        </div>
      </div>
      <div className="stories">
        {publicShops.map((s) => (
          <Link key={s.id} to={`/boutique/${s.id}`} className="story">
            <img src={s.photo} alt="" />
            {s.name}
          </Link>
        ))}
      </div>

      <div id="catalogue" className="section-head">
        <div>
          <h2>Le marché</h2>
          <p className="muted">{list.length} articles</p>
        </div>
      </div>
      <PlacePicker
        province={province}
        city={city}
        onProvince={setProvince}
        onCity={setCity}
        searchLabel="Chercher"
      />
      <input
        className="search"
        placeholder="Chercher Dunk, Yara, sac, montre…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${cat === c.id ? 'on' : ''}`}
            onClick={() => setCat(c.id)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((p) => {
          const shop = publicShops.find((s) => s.id === p.shopId)
          const km = here ? kmBetween(here, shop) : null
          return (
            <div key={p.id}>
              <ProductCard product={p} shop={shop} />
              {km != null ? <p className="muted" style={{ fontSize: 12, margin: '6px 4px 0' }}>{km} km</p> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductPage() {
  const { id } = useParams()
  const { products, shops, bumpViews, reportProduct } = useStore()
  const product = products.find((p) => p.id === id && !p.removed)
  const shop = shops.find((s) => s.id === product?.shopId)

  useEffect(() => {
    if (product) bumpViews(product.id)
  }, [product?.id])

  if (!product || !shop || shop.banned) return <p className="wrap">Produit introuvable.</p>

  return (
    <div className="wrap detail">
      <div className="detail-photo">
        <img src={product.photo} alt={product.name} />
      </div>
      <div>
        <p className="kicker">
          {shop.province} · {shop.city}
          {shop.trusted ? ' · Vérifié' : ''}
        </p>
        <h1 style={{ fontSize: 40, margin: '8px 0 10px' }}>{product.name}</h1>
        <p className="price" style={{ fontSize: 28 }}>
          {formatUsd(product.priceUsd)}
          <small>
            {formatCdf(product.priceUsd, shop)} · 1$ = {shopRate(shop).toLocaleString('fr-FR')} FC · {product.views || 0} vues
          </small>
        </p>
        <p className="lead" style={{ marginTop: 12 }}>
          {product.description}
        </p>
        <Link to={`/boutique/${shop.id}`} className="muted" style={{ display: 'inline-block', margin: '14px 0' }}>
          Boutique : {shop.name} →
        </Link>
        {shop.money?.airtel || shop.money?.mpesa || shop.money?.orange ? (
          <p className="notice">
            Mobile Money du vendeur :{' '}
            {[shop.money.airtel && `Airtel ${shop.money.airtel}`, shop.money.mpesa && `M-Pesa ${shop.money.mpesa}`, shop.money.orange && `Orange ${shop.money.orange}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : (
          <div className="notice">
            WhatsApp s’ouvre avec le nom du produit et le prix. Vous voyez ensemble pour le paiement.
          </div>
        )}
        {shop.lat && shop.lng ? (
          <iframe
            className="map-frame"
            title="Carte"
            src={mapEmbed(shop.lat, shop.lng)}
          />
        ) : null}
        <div className="row">
          <a className="btn btn-wa" href={waBuyUrl(shop, product)} target="_blank" rel="noreferrer">
            Acheter sur WhatsApp
          </a>
          <Link className="btn btn-line" to="/">
            Retour au marché
          </Link>
          <button
            className="btn btn-line"
            type="button"
            onClick={() => {
              const reason = prompt('Pourquoi signaler cet article ?')
              if (reason) {
                reportProduct({ productId: product.id, reason })
                alert('Merci. On va regarder.')
              }
            }}
          >
            Signaler
          </button>
        </div>
      </div>
    </div>
  )
}

function ShopPage() {
  const { id } = useParams()
  const { shops, products } = useStore()
  const shop = shops.find((s) => s.id === id)
  const items = products.filter((p) => p.shopId === id)
  if (!shop || shop.banned) return <p className="wrap">Boutique indisponible.</p>
  return (
    <div className="wrap">
      <div className="cover">
        <img src={shop.cover || shop.photo} alt="" />
      </div>
      <img className="avatar-lg" src={shop.photo} alt="" />
      <h1 style={{ marginTop: 8 }}>
        {shop.name} {shop.trusted ? <span className="badge-inline">Vérifié</span> : null}
      </h1>
      <p className="muted">
        {shop.province} · {shop.city} · {items.length} produits
      </p>
      <p className="lead" style={{ margin: '10px 0 16px' }}>
        {shop.bio}
      </p>
      {shop.lat && shop.lng ? (
        <iframe className="map-frame" title="Carte boutique" src={mapEmbed(shop.lat, shop.lng)} />
      ) : null}
      <a
        className="btn btn-wa"
        href={`https://wa.me/${String(shop.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${shop.name}, je viens de Best Market Yetu.`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Écrire à la boutique
      </a>
      <div className="grid" style={{ marginTop: 22 }}>
        {items.map((p) => (
          <ProductCard key={p.id} product={p} shop={shop} />
        ))}
      </div>
      {items.length === 0 ? <p className="muted">Pas encore de produits.</p> : null}
    </div>
  )
}

function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'Cet e-mail possède déjà un compte. Connecte-toi ou réinitialise ton mot de passe.'
    case 'auth/invalid-email':
      return 'Entre une adresse e-mail valide.'
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou mot de passe incorrect.'
    case 'auth/account-banned':
      return 'Ce compte a été banni par l’admin du marché.'
    case 'auth/operation-not-allowed':
      return 'La connexion e-mail n’est pas encore activée dans Firebase.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessaie dans quelques minutes.'
    default:
      return 'Une erreur est survenue. Réessaie.'
  }
}

function Auth({ mode }) {
  const { signup, login, resetPassword, user } = useStore()
  const nav = useNavigate()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/vendre" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const phone = String(fd.get('phone') || '')
    const password = String(fd.get('password') || '')
    const passwordConfirmation = String(fd.get('passwordConfirmation') || '')
    if (!email || !password || (mode === 'signup' && (!name || !phone))) {
      setError('Remplis tous les champs.')
      return
    }
    if (mode === 'signup' && password !== passwordConfirmation) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        await signup({ name, phone, email, password })
        nav('/boutique/setup')
      } else {
        await login({ email, password })
        nav('/vendre')
      }
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy(false)
    }
  }

  async function onForgotPassword() {
    setError('')
    setNotice('')
    if (!email) {
      setError('Entre ton e-mail, puis clique à nouveau sur « Mot de passe oublié ? ».')
      return
    }
    setBusy(true)
    try {
      await resetPassword(email)
      setNotice('Si un compte existe pour cet e-mail, un lien de réinitialisation vient d’être envoyé.')
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wrap" style={{ padding: '28px 0' }}>
      <h1>{mode === 'signup' ? 'Crée ton compte' : 'Connexion'}</h1>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 18 }}>
        {mode === 'signup' ? (
          <label>
            Ton nom
            <input name="name" autoComplete="name" placeholder="Ex. Grâce Kasongo" required />
          </label>
        ) : null}
        {mode === 'signup' ? (
          <label>
            Téléphone
            <input name="phone" type="tel" autoComplete="tel" placeholder="081 000 0000" required />
          </label>
        ) : null}
        <label>
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nom@exemple.com"
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength="6"
            required
          />
        </label>
        {mode === 'signup' ? (
          <label>
            Confirmer le mot de passe
            <input name="passwordConfirmation" type="password" autoComplete="new-password" minLength="6" required />
          </label>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="notice">{notice}</p> : null}
        <button className="btn btn-gold" type="submit" disabled={busy}>
          {busy ? 'Patiente…' : mode === 'signup' ? 'Créer le compte' : 'Entrer'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        {mode === 'signup' ? (
          <Link to="/connexion">J’ai déjà un compte</Link>
        ) : (
          <>
            <button className="ghost" type="button" disabled={busy} onClick={onForgotPassword}>
              Mot de passe oublié ?
            </button>{' '}
            <Link to="/inscription">Nouveau ? Crée un compte</Link>
          </>
        )}
      </p>
    </div>
  )
}

function SetupShop() {
  const { user, myShop, saveShop } = useStore()
  const nav = useNavigate()
  const [preview, setPreview] = useState(myShop?.photo || '')
  const [province, setProvince] = useState(myShop?.province || 'Kinshasa')
  const [city, setCity] = useState(myShop?.city || 'Gombe')
  const [gps, setGps] = useState(
    myShop?.lat ? { lat: myShop.lat, lng: myShop.lng } : null,
  )
  const [gpsMsg, setGpsMsg] = useState('')
  if (!user) return <Navigate to="/inscription" replace />
  if (user.banned) return <p className="wrap">Compte banni.</p>

  async function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const whatsapp = String(fd.get('whatsapp') || '').trim()
    const bio = String(fd.get('bio') || '').trim()
    const file = fd.get('photo')
    const photo = (file && file.size ? await fileToDataUrl(file) : preview) || myShop?.photo || ''
    if (!name || !whatsapp || !province || !city) return
    const id = myShop?.id || slugify(name) || `shop-${Date.now()}`
    saveShop({
      id,
      name,
      province,
      city,
      lat: gps?.lat,
      lng: gps?.lng,
      tauxCdfPerUsd: myShop?.tauxCdfPerUsd || 2800,
      money: myShop?.money || { airtel: '', mpesa: '', orange: '' },
      whatsapp: whatsapp.replace(/\D/g, ''),
      bio: bio || 'Boutique sur Best Market Yetu.',
      photo:
        photo ||
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=400&q=80',
      cover:
        myShop?.cover ||
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      featured: true,
      banned: myShop?.banned || false,
      trusted: myShop?.trusted || false,
      warnings: myShop?.warnings || [],
    })
    nav('/vendre')
  }

  return (
    <div className="wrap" style={{ padding: '28px 0' }}>
      <h1>Ta boutique</h1>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <label>
          Nom de la boutique
          <input name="name" defaultValue={myShop?.name || ''} placeholder="Ex. Kicks Gombe" />
        </label>
        <label>
          Photo
          <input
            name="photo"
            type="file"
            accept="image/*"
            onChange={async (e) => setPreview(await fileToDataUrl(e.target.files?.[0]))}
          />
        </label>
        {preview ? <img className="preview" src={preview} alt="" /> : null}
        <PlacePicker
          province={province}
          city={city}
          onProvince={setProvince}
          onCity={setCity}
          searchLabel="Trouver la ville"
        />
        <button
          className="btn btn-line"
          type="button"
          onClick={async () => {
            try {
              const pos = await readGps()
              setGps(pos)
              setGpsMsg(`Position enregistrée : ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
            } catch (err) {
              setGpsMsg(err.message)
            }
          }}
        >
          Ma position
        </button>
        {gpsMsg ? <p className="muted">{gpsMsg}</p> : null}
        <label>
          WhatsApp (avec indicatif 243)
          <input name="whatsapp" defaultValue={myShop?.whatsapp || '243'} placeholder="24381…" />
        </label>
        <label>
          Présentation
          <textarea name="bio" defaultValue={myShop?.bio || ''} placeholder="Ce que tu vends, zone de livraison…" />
        </label>
        <button className="btn btn-gold" type="submit">
          Enregistrer la boutique
        </button>
      </form>
    </div>
  )
}

function Sell() {
  const { user, myShop, products, saveShop } = useStore()
  if (!user) return <Navigate to="/inscription" replace />
  if (user.banned || myShop?.banned) {
    return (
      <div className="wrap" style={{ padding: '22px 0' }}>
        <h1>Boutique suspendue</h1>
        <p className="lead">Cette boutique a été suspendue.</p>
      </div>
    )
  }
  const mine = products.filter((p) => p.shopId === myShop?.id)
  return (
    <div className="wrap" style={{ padding: '22px 0' }}>
      <h1>{myShop ? myShop.name : 'Ta boutique'}</h1>
      {(myShop?.warnings || []).length ? (
        <div className="warn-banner">
          {myShop.warnings[myShop.warnings.length - 1].message}
        </div>
      ) : null}
      {!myShop ? (
        <p className="lead">
          Dernière étape : donne un nom, une ville et une photo à ta boutique.
        </p>
      ) : (
        <p className="lead">Publie tes souliers, parfums, sacs… Tes clients cliquent Acheter → WhatsApp.</p>
      )}
      {myShop ? (
        <div className="stats">
          <div className="stat">
            <b>{mine.length}</b>
            <span className="muted">Produits</span>
          </div>
          <div className="stat">
            <b>{mine.reduce((a, p) => a + (p.views || 0), 0)}</b>
            <span className="muted">Vues</span>
          </div>
          <div className="stat">
            <b>{myShop.city}</b>
            <span className="muted">{myShop.province}</span>
          </div>
        </div>
      ) : null}
      {myShop ? (
        <form
          className="form"
          style={{ marginBottom: 18 }}
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            saveShop({
              ...myShop,
              tauxCdfPerUsd: Number(fd.get('taux')) || myShop.tauxCdfPerUsd,
              money: {
                airtel: String(fd.get('airtel') || ''),
                mpesa: String(fd.get('mpesa') || ''),
                orange: String(fd.get('orange') || ''),
              },
            })
          }}
        >
          <label>
            Ton taux (1 $ = ? FC)
            <input name="taux" type="number" min="1" defaultValue={myShop.tauxCdfPerUsd || 2800} />
          </label>
          <label>
            Airtel Money
            <input name="airtel" defaultValue={myShop.money?.airtel || ''} placeholder="097…" />
          </label>
          <label>
            M-Pesa
            <input name="mpesa" defaultValue={myShop.money?.mpesa || ''} placeholder="081…" />
          </label>
          <label>
            Orange Money
            <input name="orange" defaultValue={myShop.money?.orange || ''} placeholder="089…" />
          </label>
          <button className="btn btn-gold" type="submit">
            Enregistrer taux & Mobile Money
          </button>
        </form>
      ) : null}
      <div className="row">
        <Link className="btn btn-gold" to={myShop ? '/publier' : '/boutique/setup'}>
          {myShop ? 'Publier un produit' : 'Créer la boutique'}
        </Link>
        {myShop ? (
          <Link className="btn btn-line" to={`/boutique/${myShop.id}`}>
            Voir ma vitrine
          </Link>
        ) : null}
        <Link className="btn btn-line" to="/boutique/setup">
          Modifier
        </Link>
      </div>
      {mine.length ? (
        <div className="grid" style={{ marginTop: 22 }}>
          {mine.map((p) => (
            <ProductCard key={p.id} product={p} shop={myShop} />
          ))}
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 18 }}>
          Aucun produit pour l’instant.
        </p>
      )}
    </div>
  )
}

function Publish() {
  const { user, myShop, publishProduct } = useStore()
  const nav = useNavigate()
  const [preview, setPreview] = useState('')
  if (!user) return <Navigate to="/inscription" replace />
  if (!myShop) return <Navigate to="/boutique/setup" replace />
  if (user.banned || myShop.banned) return <Navigate to="/vendre" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const priceUsd = Number(fd.get('priceUsd') || 0)
    const category = String(fd.get('category') || 'souliers')
    const description = String(fd.get('description') || '')
    const file = fd.get('photo')
    const photo = file && file.size ? await fileToDataUrl(file) : preview
    if (!name || !priceUsd || !photo) return
    publishProduct({
      id: `p-${Date.now()}`,
      shopId: myShop.id,
      name,
      priceUsd,
      category,
      description,
      photo,
      badge: 'Nouveau',
    })
    nav(`/boutique/${myShop.id}`)
  }

  return (
    <div className="wrap" style={{ padding: '28px 0' }}>
      <p className="kicker">{myShop.name}</p>
      <h1>Publier un produit</h1>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <label>
          Photo
          <input
            name="photo"
            type="file"
            accept="image/*"
            onChange={async (e) => setPreview(await fileToDataUrl(e.target.files?.[0]))}
          />
        </label>
        {preview ? <img className="preview" src={preview} alt="" /> : null}
        <label>
          Nom
          <input name="name" placeholder="Ex. Dunk Low, Lattafa Yara…" />
        </label>
        <label>
          Prix en dollars
          <input name="priceUsd" type="number" min="1" step="1" placeholder="25" />
        </label>
        <label>
          Catégorie
          <select name="category">
            {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea name="description" placeholder="Pointure, état, quartier de livraison…" />
        </label>
        <button className="btn btn-gold" type="submit">
          Mettre en ligne
        </button>
      </form>
    </div>
  )
}

function Favorites() {
  const { publicProducts, publicShops, favorites } = useStore()
  const list = publicProducts.filter((p) => favorites.includes(p.id))
  return (
    <div className="wrap" style={{ padding: '22px 0' }}>
      <h1>Favoris</h1>
      <p className="muted">Garde les pièces pour plus tard.</p>
      {list.length === 0 ? (
        <p className="lead" style={{ marginTop: 16 }}>
          Rien encore. Tape le cœur sur un produit.
        </p>
      ) : (
        <div className="grid" style={{ marginTop: 16 }}>
          {list.map((p) => (
            <ProductCard key={p.id} product={p} shop={publicShops.find((s) => s.id === p.shopId)} />
          ))}
        </div>
      )}
    </div>
  )
}

function Account() {
  const { user, myShop, logout } = useStore()
  const nav = useNavigate()
  if (!user) return <Navigate to="/connexion" replace />
  if (user.banned) {
    return (
      <div className="wrap" style={{ padding: '22px 0' }}>
        <h1>Compte banni</h1>
        <p className="lead">Ce compte a été suspendu.</p>
      </div>
    )
  }
  return (
    <div className="wrap" style={{ padding: '22px 0' }}>
      <h1>{user.name}</h1>
      <p className="muted">{user.phone}</p>
      <p className="muted">{user.email}</p>
      <p className="lead">{myShop ? `Boutique : ${myShop.name}` : 'Pas encore de boutique.'}</p>
      <div className="row">
        <Link className="btn btn-gold" to="/vendre">
          Espace vendeur
        </Link>
        <button
          className="btn btn-line"
          type="button"
          onClick={async () => {
            await logout()
            nav('/')
          }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin_best_king" element={<AdminPage />} />
            <Route path="/produit/:id" element={<ProductPage />} />
            <Route path="/boutique/setup" element={<SetupShop />} />
            <Route path="/boutique/:id" element={<ShopPage />} />
            <Route path="/inscription" element={<Auth mode="signup" />} />
            <Route path="/connexion" element={<Auth mode="login" />} />
            <Route path="/vendre" element={<Sell />} />
            <Route path="/publier" element={<Publish />} />
            <Route path="/favoris" element={<Favorites />} />
            <Route path="/compte" element={<Account />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </StoreProvider>
  )
}
