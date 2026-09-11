import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatUsd, formatCdf } from './data'
import { useStore } from './store.jsx'

function displayDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function AdminPage() {
  const {
    adminOn,
    adminLogin,
    adminLogout,
    shops,
    products,
    users,
    reports,
    warnShop,
    removeProduct,
    banShop,
    unbanShop,
    setTrusted,
  } = useStore()
  const [error, setError] = useState('')

  function onLogin(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const ok = adminLogin(String(fd.get('username') || ''), String(fd.get('password') || ''))
    if (!ok) setError('Identifiants incorrects.')
  }

  if (!adminOn) {
    return (
      <div className="wrap admin-login">
        <h1>Connexion</h1>
        <form className="form" onSubmit={onLogin}>
          <label>
            Nom d’utilisateur
            <input name="username" autoComplete="username" />
          </label>
          <label>
            Mot de passe
            <input name="password" type="password" autoComplete="current-password" />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn-gold" type="submit">
            Entrer
          </button>
        </form>
      </div>
    )
  }

  const openReports = reports.filter((r) => r.open)

  return (
    <div className="wrap admin-dash">
      <div className="section-head">
        <div>
          <h1>Boutiques</h1>
        </div>
        <button className="btn btn-line" type="button" onClick={adminLogout}>
          Quitter
        </button>
      </div>

      {openReports.length ? (
        <div className="warn-banner">
          {openReports.length} signalement(s) en attente.
        </div>
      ) : null}

      <section className="admin-reports" aria-labelledby="reports-title">
        <div className="section-head">
          <div>
            <h2 id="reports-title">Signalements</h2>
            <p className="muted">L’administration voit le signalant, son message et le vendeur concerné.</p>
          </div>
        </div>
        {openReports.length ? (
          <div className="report-list">
            {openReports.map((report) => {
              const product = products.find((item) => item.id === report.productId)
              const shop = shops.find((item) => item.id === (report.shopId || product?.shopId))
              const reporter = users.find((item) => item.id === report.reporterId)
              const merchant = users.find((item) => item.id === report.merchantId || item.shopId === (report.shopId || product?.shopId))
              const shopName = report.shopName || shop?.name || 'Boutique inconnue'
              const reporterName = report.reporterName || reporter?.name || 'Signalant non identifié'
              const merchantName = report.merchantName || merchant?.name || shopName
              return (
                <article className="report-card" key={report.id}>
                  <p className="kicker">{report.type === 'shop' ? 'Compte / boutique' : 'Publication'}</p>
                  <h3>{report.productName || product?.name || shopName}</h3>
                  <p><b>Boutique signalée :</b> {shopName}</p>
                  <p><b>Vendeur :</b> {merchantName}</p>
                  <p><b>Signalé par :</b> {reporterName}</p>
                  <p><b>Message :</b> {report.message || report.reason || 'Aucun message'}</p>
                  <p className="muted">{displayDate(report.at)}</p>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="muted">Aucun signalement ouvert.</p>
        )}
      </section>

      <div className="admin-list">
        {shops.map((shop) => {
          const owner = users.find((u) => u.shopId === shop.id)
          const items = products.filter((p) => p.shopId === shop.id)
          return (
            <article key={shop.id} className={`admin-card ${shop.banned ? 'is-banned' : ''}`}>
              <div className="admin-card-head">
                <img src={shop.photo} alt="" />
                <div>
                  <h2>
                    {shop.name}{' '}
                    {shop.trusted ? <span className="badge-inline">Vérifié</span> : null}
                  </h2>
                  <p className="muted">
                    {shop.province} · {shop.city} · WA {shop.whatsapp}
                    {owner ? ` · ${owner.name} (${owner.phone})` : ''}
                    {shop.banned ? ' · BANNI' : ''}
                  </p>
                  {(shop.warnings || []).slice(-1).map((w) => (
                    <p key={w.at} className="error">
                      Dernier avis : {w.message}
                    </p>
                  ))}
                </div>
              </div>
              <div className="row">
                {shop.banned ? (
                  <button className="btn btn-line" type="button" onClick={() => unbanShop(shop.id)}>
                    Lever le ban
                  </button>
                ) : (
                  <button
                    className="btn btn-line"
                    type="button"
                    onClick={() => {
                      if (confirm(`Bannir ${shop.name} ? La boutique disparaît du marché.`)) {
                        banShop(shop.id)
                      }
                    }}
                  >
                    Bannir
                  </button>
                )}
                <button
                  className="btn btn-line"
                  type="button"
                  onClick={() => {
                    const message = prompt('Message pour le vendeur :')
                    if (message) warnShop(shop.id, message)
                  }}
                >
                  Avertir
                </button>
                <button
                  className="btn btn-gold"
                  type="button"
                  onClick={() => setTrusted(shop.id, !shop.trusted)}
                >
                  {shop.trusted ? 'Retirer vérifié' : 'Marquer vérifié'}
                </button>
                <Link className="btn btn-line" to={`/boutique/${shop.id}`}>
                  Voir
                </Link>
              </div>
              <ul className="admin-products">
                {items.map((p) => (
                  <li key={p.id}>
                    <span>
                      {p.name} · {formatUsd(p.priceUsd)} ({formatCdf(p.priceUsd, shop)})
                    </span>
                    <span className="row" style={{ marginTop: 0 }}>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          const message = prompt(
                            'Avertir puis supprimer :',
                            `${p.name} retiré (contenu non conforme).`,
                          )
                          if (message != null) {
                            removeProduct(p.id, { warn: true, shopId: shop.id, message })
                          }
                        }}
                      >
                        Avertir + supprimer
                      </button>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => {
                          if (confirm(`Supprimer ${p.name} sans avertissement ?`)) {
                            removeProduct(p.id, { warn: false, shopId: shop.id })
                          }
                        }}
                      >
                        Supprimer sans avis
                      </button>
                    </span>
                  </li>
                ))}
                {items.length === 0 ? <li className="muted">Aucun produit</li> : null}
              </ul>
            </article>
          )
        })}
      </div>
    </div>
  )
}
