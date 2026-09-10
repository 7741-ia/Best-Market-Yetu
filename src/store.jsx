import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS, SHOPS } from './data'
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './geo'

const KEY = 'bmy-store-v2'
const ADMIN_KEY = 'bmy-admin-v1'
const StoreContext = createContext(null)

const empty = () => ({
  users: [],
  sessionId: null,
  shops: SHOPS,
  products: PRODUCTS,
  favorites: [],
  reports: [],
  logs: [],
})

function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('bmy-store-v1')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...empty(),
        ...parsed,
        shops: (parsed.shops?.length ? parsed.shops : SHOPS).map((s) => ({
          banned: false,
          trusted: false,
          warnings: [],
          tauxCdfPerUsd: 2800,
          money: { airtel: '', mpesa: '', orange: '' },
          ...s,
        })),
        products: parsed.products?.length ? parsed.products : PRODUCTS,
        reports: parsed.reports || [],
        logs: parsed.logs || [],
      }
    }
  } catch {
    /* ignore */
  }
  return empty()
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [adminOn, setAdminOn] = useState(() => sessionStorage.getItem(ADMIN_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const user = state.users.find((u) => u.id === state.sessionId) || null
  const myShop = user ? state.shops.find((s) => s.id === user.shopId) || null : null

  const api = useMemo(
    () => ({
      user,
      myShop,
      shops: state.shops,
      products: state.products,
      favorites: state.favorites,
      reports: state.reports,
      logs: state.logs,
      users: state.users,
      adminOn,
      publicShops: state.shops.filter((s) => !s.banned),
      publicProducts: state.products.filter((p) => {
        const shop = state.shops.find((s) => s.id === p.shopId)
        return shop && !shop.banned && !p.removed
      }),
      signup({ name, phone, password }) {
        const id = `u-${Date.now()}`
        const next = {
          id,
          name: name.trim(),
          phone: phone.trim(),
          password,
          shopId: null,
          banned: false,
        }
        setState((s) => ({
          ...s,
          users: [...s.users, next],
          sessionId: id,
        }))
        return next
      },
      login({ phone, password }) {
        const found = state.users.find(
          (u) => u.phone.trim() === phone.trim() && u.password === password,
        )
        if (!found) return { ok: false, reason: 'identifiants' }
        if (found.banned) return { ok: false, reason: 'banni' }
        setState((s) => ({ ...s, sessionId: found.id }))
        return { ok: true, user: found }
      },
      logout() {
        setState((s) => ({ ...s, sessionId: null }))
      },
      saveShop(shop) {
        setState((s) => {
          const exists = s.shops.some((x) => x.id === shop.id)
          const shops = exists
            ? s.shops.map((x) => (x.id === shop.id ? { ...x, ...shop } : x))
            : [{ banned: false, warnings: [], trusted: false, ...shop }, ...s.shops]
          const users = s.users.map((u) =>
            u.id === s.sessionId ? { ...u, shopId: shop.id } : u,
          )
          return { ...s, shops, users }
        })
      },
      publishProduct(product) {
        setState((s) => ({
          ...s,
          products: [{ ...product, views: 0, removed: false }, ...s.products],
        }))
      },
      toggleFav(id) {
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        }))
      },
      bumpViews(id) {
        setState((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === id ? { ...p, views: (p.views || 0) + 1 } : p,
          ),
        }))
      },
      reportProduct({ productId, reason }) {
        setState((s) => ({
          ...s,
          reports: [
            {
              id: `r-${Date.now()}`,
              productId,
              reason,
              at: new Date().toISOString(),
              open: true,
            },
            ...s.reports,
          ],
        }))
      },
      adminLogin(username, password) {
        const ok =
          username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD
        if (ok) {
          sessionStorage.setItem(ADMIN_KEY, '1')
          setAdminOn(true)
        }
        return ok
      },
      adminLogout() {
        sessionStorage.removeItem(ADMIN_KEY)
        setAdminOn(false)
      },
      warnShop(shopId, message) {
        setState((s) => ({
          ...s,
          shops: s.shops.map((x) =>
            x.id === shopId
              ? {
                  ...x,
                  warnings: [
                    ...(x.warnings || []),
                    { at: new Date().toISOString(), message },
                  ],
                }
              : x,
          ),
          logs: [{ at: Date.now(), type: 'warn', shopId, message }, ...s.logs],
        }))
      },
      removeProduct(productId, { warn, shopId, message } = {}) {
        setState((s) => {
          let shops = s.shops
          if (warn && shopId) {
            shops = shops.map((x) =>
              x.id === shopId
                ? {
                    ...x,
                    warnings: [
                      ...(x.warnings || []),
                      {
                        at: new Date().toISOString(),
                        message:
                          message ||
                          'Un article a été retiré : contenu non conforme.',
                      },
                    ],
                  }
                : x,
            )
          }
          return {
            ...s,
            shops,
            products: s.products.filter((p) => p.id !== productId),
            reports: s.reports.map((r) =>
              r.productId === productId ? { ...r, open: false } : r,
            ),
            logs: [{ at: Date.now(), type: 'delete-product', productId, warn }, ...s.logs],
          }
        })
      },
      banShop(shopId) {
        setState((s) => ({
          ...s,
          shops: s.shops.map((x) =>
            x.id === shopId ? { ...x, banned: true } : x,
          ),
          users: s.users.map((u) =>
            u.shopId === shopId ? { ...u, banned: true } : u,
          ),
          sessionId: s.users.find((u) => u.id === s.sessionId)?.shopId === shopId
            ? null
            : s.sessionId,
          logs: [{ at: Date.now(), type: 'ban', shopId }, ...s.logs],
        }))
      },
      unbanShop(shopId) {
        setState((s) => ({
          ...s,
          shops: s.shops.map((x) =>
            x.id === shopId ? { ...x, banned: false } : x,
          ),
          users: s.users.map((u) =>
            u.shopId === shopId ? { ...u, banned: false } : u,
          ),
          logs: [{ at: Date.now(), type: 'unban', shopId }, ...s.logs],
        }))
      },
      setTrusted(shopId, trusted) {
        setState((s) => ({
          ...s,
          shops: s.shops.map((x) => (x.id === shopId ? { ...x, trusted } : x)),
        }))
      },
    }),
    [state, user, myShop, adminOn],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
