import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES, CITIES, formatCdf, formatUsd, slugify, waBuyUrl } from './data'
import { StoreProvider, useStore } from './store.jsx'

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
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">BY</span>
          <span>
            Best Market Yetu
            <small>Ta boutique, sans magasin</small>
          </span>
        </Link>
        <Link className="ghost" to={user ? '/vendre' : '/inscription'}>
          {user ? 'Vendre' : 'Créer ma boutique'}
        </Link>
      </header>
      {children}
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
        </p>
        <p className="price">
          {formatUsd(product.priceUsd)}
          <small>{formatCdf(product.priceUsd)}</small>
        </p>
      </div>
    </article>
  )
}

function Home() {
  const { products, shops } = useStore()
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [city, setCity] = useState('all')

  const list = useMemo(() => {
    return products.filter((p) => {
      const shop = shops.find((s) => s.id === p.shopId)
      const okCat = cat === 'all' || p.category === cat
      const okCity = city === 'all' || shop?.city === city
      const okQ = `${p.name} ${shop?.name}`.toLowerCase().includes(q.toLowerCase())
      return okCat && okCity && okQ
    })
  }, [products, shops, cat, city, q])

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <p className="kicker">Kinshasa · Lubumbashi · Goma</p>
          <h1>Vends tes souliers, parfums et plus — sans boutique.</h1>
          <p className="lead">
            Crée ta vitrine, publie tes produits, et tes clients t’écrivent direct sur WhatsApp.
            Cash, Airtel Money, M-Pesa ou Orange Money : vous vous arrangez ensemble.
          </p>
          <div className="row">
            <Link className="btn btn-gold" to="/inscription">
              Ouvrir ma boutique
            </Link>
            <a className="btn btn-line" href="#catalogue">
              Voir les produits
            </a>
          </div>
        </div>
        <div className="hero-card">
          <img
            src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80"
            alt="Sneakers"
          />
          <span>
            <b>Achat en 1 clic WhatsApp</b>
            <br />
            <small>Pas encore de paiement in-app — volontairement simple.</small>
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
        {shops.map((s) => (
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
        <select className="chip" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">Toutes les villes</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
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
        {list.map((p) => (
          <ProductCard key={p.id} product={p} shop={shops.find((s) => s.id === p.shopId)} />
        ))}
      </div>
    </div>
  )
}

function ProductPage() {
  const { id } = useParams()
  const { products, shops, bumpViews } = useStore()
  const product = products.find((p) => p.id === id)
  const shop = shops.find((s) => s.id === product?.shopId)

  useEffect(() => {
    if (product) bumpViews(product.id)
  }, [product?.id])

  if (!product || !shop) return <p className="wrap">Produit introuvable.</p>

  return (
    <div className="wrap detail">
      <div className="detail-photo">
        <img src={product.photo} alt={product.name} />
      </div>
      <div>
        <p className="kicker">{shop.city}</p>
        <h1 style={{ fontSize: 40, margin: '8px 0 10px' }}>{product.name}</h1>
        <p className="price" style={{ fontSize: 28 }}>
          {formatUsd(product.priceUsd)}
          <small>{formatCdf(product.priceUsd)} · {product.views || 0} vues</small>
        </p>
        <p className="lead" style={{ marginTop: 12 }}>
          {product.description}
        </p>
        <Link to={`/boutique/${shop.id}`} className="muted" style={{ display: 'inline-block', margin: '14px 0' }}>
          Boutique : {shop.name} →
        </Link>
        <div className="notice">
          Le bouton ouvre WhatsApp avec le nom du produit et le prix. Vous confirmez le paiement
          ensemble (cash ou Mobile Money).
        </div>
        <div className="row">
          <a className="btn btn-wa" href={waBuyUrl(shop, product)} target="_blank" rel="noreferrer">
            Acheter sur WhatsApp
          </a>
          <Link className="btn btn-line" to="/">
            Retour au marché
          </Link>
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
  if (!shop) return <p className="wrap">Boutique introuvable.</p>
  return (
    <div className="wrap">
      <div className="cover">
        <img src={shop.cover || shop.photo} alt="" />
      </div>
      <img className="avatar-lg" src={shop.photo} alt="" />
      <h1 style={{ marginTop: 8 }}>{shop.name}</h1>
      <p className="muted">
        {shop.city} · {items.length} produits
      </p>
      <p className="lead" style={{ margin: '10px 0 16px' }}>
        {shop.bio}
      </p>
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

function Auth({ mode }) {
  const { signup, login, user } = useStore()
  const nav = useNavigate()
  const [error, setError] = useState('')
  if (user) return <Navigate to="/vendre" replace />

  function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const phone = String(fd.get('phone') || '')
    const password = String(fd.get('password') || '')
    if (mode === 'signup') {
      if (!name || !phone || !password) return setError('Remplis tous les champs.')
      signup({ name, phone, password })
      nav('/boutique/setup')
    } else {
      const ok = login({ phone, password })
      if (!ok) return setError('Téléphone ou mot de passe incorrect.')
      nav('/vendre')
    }
  }

  return (
    <div className="wrap" style={{ padding: '28px 0' }}>
      <p className="kicker">Compte vendeur</p>
      <h1>{mode === 'signup' ? 'Crée ton compte boutique' : 'Connexion'}</h1>
      <p className="lead">Gratuit. Tes infos restent sur cet appareil (prototype).</p>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 18 }}>
        {mode === 'signup' ? (
          <label>
            Ton nom
            <input name="name" placeholder="Ex. Grâce Kasongo" />
          </label>
        ) : null}
        <label>
          Téléphone
          <input name="phone" placeholder="081 000 0000" />
        </label>
        <label>
          Mot de passe
          <input name="password" type="password" />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn-gold" type="submit">
          {mode === 'signup' ? 'Créer le compte' : 'Entrer'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        {mode === 'signup' ? (
          <Link to="/connexion">J’ai déjà un compte</Link>
        ) : (
          <Link to="/inscription">Nouveau ? Crée un compte</Link>
        )}
      </p>
    </div>
  )
}

function SetupShop() {
  const { user, myShop, saveShop } = useStore()
  const nav = useNavigate()
  const [preview, setPreview] = useState(myShop?.photo || '')
  if (!user) return <Navigate to="/inscription" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const city = String(fd.get('city') || 'Kinshasa')
    const whatsapp = String(fd.get('whatsapp') || '').trim()
    const bio = String(fd.get('bio') || '').trim()
    const file = fd.get('photo')
    const photo = (file && file.size ? await fileToDataUrl(file) : preview) || myShop?.photo || ''
    if (!name || !whatsapp) return
    const id = myShop?.id || slugify(name) || `shop-${Date.now()}`
    saveShop({
      id,
      name,
      city,
      whatsapp: whatsapp.replace(/\D/g, ''),
      bio: bio || 'Boutique sur Best Market Yetu.',
      photo:
        photo ||
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=400&q=80',
      cover:
        myShop?.cover ||
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      featured: true,
    })
    nav('/vendre')
  }

  return (
    <div className="wrap" style={{ padding: '28px 0' }}>
      <p className="kicker">Ta vitrine</p>
      <h1>Nom et photo de boutique</h1>
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
        <label>
          Ville
          <select name="city" defaultValue={myShop?.city || 'Kinshasa'}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
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
  const { user, myShop, products } = useStore()
  if (!user) return <Navigate to="/inscription" replace />
  const mine = products.filter((p) => p.shopId === myShop?.id)
  return (
    <div className="wrap" style={{ padding: '22px 0' }}>
      <p className="kicker">Espace vendeur</p>
      <h1>{myShop ? myShop.name : 'Ta boutique'}</h1>
      {!myShop ? (
        <p className="lead">
          Dernière étape : donne un nom et une photo à ta boutique.
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
            <span className="muted">Ville</span>
          </div>
        </div>
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
  const { products, shops, favorites } = useStore()
  const list = products.filter((p) => favorites.includes(p.id))
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
            <ProductCard key={p.id} product={p} shop={shops.find((s) => s.id === p.shopId)} />
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
  return (
    <div className="wrap" style={{ padding: '22px 0' }}>
      <h1>{user.name}</h1>
      <p className="muted">{user.phone}</p>
      <p className="lead">{myShop ? `Boutique : ${myShop.name}` : 'Pas encore de boutique.'}</p>
      <div className="row">
        <Link className="btn btn-gold" to="/vendre">
          Espace vendeur
        </Link>
        <button
          className="btn btn-line"
          type="button"
          onClick={() => {
            logout()
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
