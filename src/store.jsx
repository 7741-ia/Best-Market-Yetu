import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS, SHOPS } from './data'

const KEY = 'bmy-store-v1'
const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {
    users: [],
    sessionId: null,
    shops: SHOPS,
    products: PRODUCTS,
    favorites: [],
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const user = state.users.find((u) => u.id === state.sessionId) || null
  const myShop = user
    ? state.shops.find((s) => s.id === user.shopId) || null
    : null

  const api = useMemo(
    () => ({
      user,
      myShop,
      shops: state.shops,
      products: state.products,
      favorites: state.favorites,
      signup({ name, phone, password }) {
        const id = `u-${Date.now()}`
        const next = {
          id,
          name: name.trim(),
          phone: phone.trim(),
          password,
          shopId: null,
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
        if (!found) return null
        setState((s) => ({ ...s, sessionId: found.id }))
        return found
      },
      logout() {
        setState((s) => ({ ...s, sessionId: null }))
      },
      saveShop(shop) {
        setState((s) => {
          const exists = s.shops.some((x) => x.id === shop.id)
          const shops = exists
            ? s.shops.map((x) => (x.id === shop.id ? { ...x, ...shop } : x))
            : [shop, ...s.shops]
          const users = s.users.map((u) =>
            u.id === s.sessionId ? { ...u, shopId: shop.id } : u,
          )
          return { ...s, shops, users }
        })
      },
      publishProduct(product) {
        setState((s) => ({
          ...s,
          products: [{ ...product, views: 0 }, ...s.products],
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
    }),
    [state, user, myShop],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
