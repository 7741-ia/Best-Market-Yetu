import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { PRODUCTS, SHOPS } from './data'
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './geo'

const KEY = 'bmy-store-v2'
const ADMIN_KEY = 'bmy-admin-v1'
const StoreContext = createContext(null)

function withoutPassword(user) {
  const { password: _password, ...safeUser } = user
  return safeUser
}

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
        // A session is specific to the current browser and must never be shared.
        sessionId: null,
        users: (parsed.users || []).map(withoutPassword),
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
  const [online, setOnline] = useState(false)
  // Firebase auth needs a moment to restore the session on page load. Until it
  // is "ready" we must not redirect the user to /inscription, otherwise the
  // shop creation screen sometimes refuses to open.
  const [ready, setReady] = useState(false)
  const lastSentRef = useRef(null)
  const remoteReadyRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  // Firebase keeps the signed-in account between page refreshes. The account
  // id is local to this browser; it is not stored in the shared Firestore data.
  useEffect(() => {
    auth.languageCode = 'fr'
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setReady(true)
      setState((s) => {
        if (!firebaseUser) {
          return s.sessionId ? { ...s, sessionId: null } : s
        }

        const existing = s.users.find((u) => u.id === firebaseUser.uid)
        const nextUser = {
          ...existing,
          id: firebaseUser.uid,
          name: existing?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Vendeur',
          email: firebaseUser.email || existing?.email || '',
          phone: existing?.phone || '',
          shopId: existing?.shopId || null,
          banned: existing?.banned || false,
        }
        return {
          ...s,
          users: existing
            ? s.users.map((u) => (u.id === firebaseUser.uid ? nextUser : u))
            : [...s.users, nextUser],
          sessionId: firebaseUser.uid,
        }
      })
    })
    return () => unsub()
  }, [])

  // ---- Sync Firestore : un seul document partagé par tout le monde ----
  useEffect(() => {
    const ref = doc(db, 'bmy', 'state')

    // Créer le document s'il n'existe pas encore
    getDoc(ref)
      .then((snap) => {
        if (!snap.exists()) {
          setDoc(ref, { data: JSON.stringify({ ...empty(), sessionId: null }) })
        }
      })
      .catch(() => {})

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setOnline(true)
        if (!snap.exists()) return
        try {
          const parsed = JSON.parse(snap.data().data)
          lastSentRef.current = snap.data().data
          remoteReadyRef.current = true
          setState((s) => {
            const sessionId = auth.currentUser?.uid || null
            const remoteUsers = (parsed.users || []).map(withoutPassword)
            const signedInUser = sessionId ? s.users.find((u) => u.id === sessionId) : null
            const users =
              signedInUser && !remoteUsers.some((u) => u.id === sessionId)
                ? [...remoteUsers, signedInUser]
                : remoteUsers
            return {
              ...empty(),
              ...parsed,
              users,
              sessionId,
              shops: (parsed.shops?.length ? parsed.shops : SHOPS).map((sh) => ({
                banned: false,
                trusted: false,
                warnings: [],
                tauxCdfPerUsd: 2800,
                money: { airtel: '', mpesa: '', orange: '' },
                ...sh,
              })),
              products: parsed.products?.length ? parsed.products : PRODUCTS,
              reports: parsed.reports || [],
              logs: parsed.logs || [],
            }
          })
        } catch {
          /* ignore */
        }
      },
      () => setOnline(false),
    )

    return () => {
      unsub()
    }
  }, [])

  // Écrire les changements locaux vers Firestore (débouncé)
  useEffect(() => {
    if (!remoteReadyRef.current) return
    const { sessionId: _sessionId, users, ...sharedState } = state
    const payload = JSON.stringify({
      ...sharedState,
      users: users.map(withoutPassword),
      sessionId: null,
    })
    if (payload === lastSentRef.current) return
    const timer = setTimeout(() => {
      lastSentRef.current = payload
      setDoc(doc(db, 'bmy', 'state'), { data: payload }).catch(() => setOnline(false))
    }, 700)
    return () => clearTimeout(timer)
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
      online,
      ready,
      publicShops: state.shops.filter((s) => !s.banned),
      publicProducts: state.products.filter((p) => {
        const shop = state.shops.find((s) => s.id === p.shopId)
        return shop && !shop.banned && !p.removed
      }),
      async signup({ name, phone, email, password }) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(credential.user, { displayName: name.trim() })
        const id = credential.user.uid
        const next = {
          id,
          name: name.trim(),
          phone: phone.trim(),
          email: credential.user.email || email.trim(),
          shopId: null,
          banned: false,
        }
        setState((s) => ({
          ...s,
          users: s.users.some((u) => u.id === id)
            ? s.users.map((u) => (u.id === id ? { ...u, ...next } : u))
            : [...s.users, next],
          sessionId: id,
        }))
        return next
      },
      async login({ email, password }) {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
        const found = state.users.find((u) => u.id === credential.user.uid)
        if (found?.banned) {
          await signOut(auth)
          const error = new Error('Compte suspendu.')
          error.code = 'auth/account-banned'
          throw error
        }
        setState((s) => ({ ...s, sessionId: credential.user.uid }))
        return credential.user
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email.trim())
      },
      async logout() {
        await signOut(auth)
        setState((s) => ({ ...s, sessionId: null }))
      },
      saveShop(shop) {
        // Vérifie que le vendeur a bien un compte avant de créer la boutique.
        if (!state.sessionId) {
          throw new Error('Connecte-toi avant de créer ta boutique.')
        }
        setState((s) => {
          if (!s.sessionId) {
            throw new Error('Connecte-toi avant de créer ta boutique.')
          }
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
    [state, user, myShop, adminOn, online, ready],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
