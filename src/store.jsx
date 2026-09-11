import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
const LEGACY_DEMO_SHOP_IDS = new Set(['kicks-gombe', 'parfum-sika', 'mama-style', 'gold-wrist'])
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

function productionShops(shops) {
  return (shops || [])
    .filter((shop) => !LEGACY_DEMO_SHOP_IDS.has(shop.id))
    .map((shop) => ({
      banned: false,
      trusted: false,
      warnings: [],
      tauxCdfPerUsd: 2800,
      money: { airtel: '', mpesa: '', orange: '' },
      ...shop,
    }))
}

function productionProducts(products) {
  return (products || []).filter((product) => !LEGACY_DEMO_SHOP_IDS.has(product.shopId))
}

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
        shops: productionShops(parsed.shops),
        products: productionProducts(parsed.products),
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
  const [syncReady, setSyncReady] = useState(false)
  const [syncError, setSyncError] = useState('')
  // Firebase auth needs a moment to restore the session on page load. Until it
  // is "ready" we must not redirect the user to /inscription, otherwise the
  // shop creation screen sometimes refuses to open.
  const [ready, setReady] = useState(false)
  const lastSentRef = useRef(null)
  const remoteReadyRef = useRef(false)
  const hasPendingLocalChangesRef = useRef(false)
  const pendingPayloadRef = useRef(null)

  function protectLocalChanges() {
    // A slow first Firestore response can arrive after a user just created a
    // shop or product. Keep that old response from replacing the new local
    // state before the write reaches Firestore.
    hasPendingLocalChangesRef.current = true
    pendingPayloadRef.current = null
  }

  function sharedPayload(source) {
    const { sessionId: _sessionId, users, ...sharedState } = source
    return JSON.stringify({
      ...sharedState,
      users: users.map(withoutPassword),
      sessionId: null,
    })
  }

  async function persistMarketState(nextState) {
    const payload = sharedPayload(nextState)
    protectLocalChanges()
    pendingPayloadRef.current = payload
    lastSentRef.current = payload
    try {
      await setDoc(doc(db, 'bmy', 'state'), { data: payload })
      setOnline(true)
      setSyncError('')
    } catch (error) {
      if (pendingPayloadRef.current === payload) {
        pendingPayloadRef.current = null
        hasPendingLocalChangesRef.current = false
        lastSentRef.current = null
      }
      setOnline(false)
      setSyncError('La sauvegarde dans Firebase a échoué. Vérifie la connexion et les règles Firestore.')
      throw error
    }
  }

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
      .catch(() => setSyncError('Impossible de joindre Firebase. Réessaie quand la connexion est rétablie.'))

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setOnline(true)
        setSyncError('')
        if (!snap.exists()) return
        try {
          const incomingPayload = snap.data().data
          const parsed = JSON.parse(incomingPayload)
          remoteReadyRef.current = true
          setSyncReady(true)

          // Ignore an older remote snapshot while a local marketplace change
          // is waiting to be written. We accept the snapshot that confirms
          // exactly the payload we just sent.
          if (
            hasPendingLocalChangesRef.current &&
            incomingPayload !== pendingPayloadRef.current
          ) {
            return
          }

          if (incomingPayload === pendingPayloadRef.current) {
            hasPendingLocalChangesRef.current = false
            pendingPayloadRef.current = null
          }
          lastSentRef.current = incomingPayload
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
              shops: productionShops(parsed.shops),
              products: productionProducts(parsed.products),
              reports: parsed.reports || [],
              logs: parsed.logs || [],
            }
          })
        } catch {
          /* ignore */
        }
      },
      () => {
        setOnline(false)
        setSyncError('Impossible de synchroniser le marché avec Firebase.')
      },
    )

    return () => {
      unsub()
    }
  }, [])

  // Écrire les changements locaux vers Firestore (débouncé)
  useEffect(() => {
    if (!remoteReadyRef.current || !syncReady) return
    const payload = sharedPayload(state)
    if (payload === lastSentRef.current) return
    const timer = setTimeout(() => {
      lastSentRef.current = payload
      pendingPayloadRef.current = payload
      setDoc(doc(db, 'bmy', 'state'), { data: payload }).catch(() => {
        setOnline(false)
        setSyncError('La sauvegarde dans Firebase a échoué. Vérifie la connexion et les règles Firestore.')
      })
    }, 700)
    return () => clearTimeout(timer)
  }, [state, syncReady])

  const user = state.users.find((u) => u.id === state.sessionId) || null
  const myShop = user ? state.shops.find((s) => s.id === user.shopId) || null : null

  const createReport = useCallback(async ({ type, productId, shopId, message }) => {
    if (!state.sessionId) {
      throw new Error('Connecte-toi avant d’envoyer un signalement.')
    }
    if (!syncReady) {
      throw new Error('Le marché est encore en chargement. Réessaie dans quelques secondes.')
    }

    const text = String(message || '').trim()
    if (!text || text.length > 600) {
      throw new Error('Le message du signalement doit contenir entre 1 et 600 caractères.')
    }

    const reporter = state.users.find((u) => u.id === state.sessionId)
    const product = productId ? state.products.find((p) => p.id === productId) : null
    const targetShopId = shopId || product?.shopId
    const shop = state.shops.find((s) => s.id === targetShopId)
    const merchant = state.users.find((u) => u.shopId === targetShopId)
    if (!shop || (type === 'product' && !product)) {
      throw new Error('Cette publication ou cette boutique n’existe plus.')
    }
    if (reporter?.shopId === shop.id) {
      throw new Error('Tu ne peux pas signaler ta propre boutique.')
    }

    const report = {
      id: `r-${Date.now()}`,
      type,
      productId: product?.id || null,
      productName: product?.name || '',
      shopId: shop.id,
      shopName: shop.name,
      merchantId: merchant?.id || null,
      merchantName: merchant?.name || shop.name,
      reporterId: reporter?.id || state.sessionId,
      reporterName: reporter?.name || 'Membre',
      message: text,
      // Conservé pour afficher les signalements créés avec l'ancienne version.
      reason: text,
      at: new Date().toISOString(),
      open: true,
    }
    const nextState = { ...state, reports: [report, ...state.reports] }
    setState(nextState)
    await persistMarketState(nextState)
  }, [state, syncReady])

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
      marketReady: syncReady,
      marketError: syncError,
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
        protectLocalChanges()
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
      async saveShop(shop) {
        // Vérifie que le vendeur a bien un compte avant de créer la boutique.
        if (!state.sessionId) {
          throw new Error('Connecte-toi avant de créer ta boutique.')
        }
        if (!syncReady) {
          throw new Error('Le marché est encore en chargement. Attends quelques secondes puis réessaie.')
        }
        const exists = state.shops.some((x) => x.id === shop.id)
        const shops = exists
          ? state.shops.map((x) => (x.id === shop.id ? { ...x, ...shop } : x))
          : [{ banned: false, warnings: [], trusted: false, ...shop }, ...state.shops]
        const users = state.users.map((u) =>
          u.id === state.sessionId ? { ...u, shopId: shop.id } : u,
        )
        const nextState = { ...state, shops, users }
        setState(nextState)
        await persistMarketState(nextState)
      },
      async publishProduct(product) {
        if (!state.sessionId) {
          throw new Error('Connecte-toi avant de publier un article.')
        }
        if (!syncReady) {
          throw new Error('Le marché est encore en chargement. Attends quelques secondes puis réessaie.')
        }
        const nextState = {
          ...state,
          products: [{ ...product, views: 0, removed: false }, ...state.products],
        }
        setState(nextState)
        await persistMarketState(nextState)
      },
      async updateProduct(productId, updates) {
        if (!state.sessionId) {
          throw new Error('Connecte-toi avant de modifier un article.')
        }
        if (!syncReady) {
          throw new Error('Le marché est encore en chargement. Attends quelques secondes puis réessaie.')
        }
        const current = state.products.find((p) => p.id === productId)
        if (!current || current.shopId !== myShop?.id) {
          throw new Error('Tu ne peux modifier que les articles de ta boutique.')
        }
        const nextState = {
          ...state,
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, ...updates, id: current.id, shopId: current.shopId, views: current.views || 0, removed: false }
              : p,
          ),
        }
        setState(nextState)
        await persistMarketState(nextState)
      },
      async deleteMyProduct(productId) {
        if (!state.sessionId) {
          throw new Error('Connecte-toi avant de supprimer un article.')
        }
        if (!syncReady) {
          throw new Error('Le marché est encore en chargement. Attends quelques secondes puis réessaie.')
        }
        const current = state.products.find((p) => p.id === productId)
        if (!current || current.shopId !== myShop?.id) {
          throw new Error('Tu ne peux supprimer que les articles de ta boutique.')
        }
        const nextState = {
          ...state,
          products: state.products.filter((p) => p.id !== productId),
          reports: state.reports.map((r) =>
            r.productId === productId ? { ...r, open: false } : r,
          ),
          logs: [{ at: Date.now(), type: 'seller-delete-product', productId }, ...state.logs],
        }
        setState(nextState)
        await persistMarketState(nextState)
      },
      toggleFav(id) {
        protectLocalChanges()
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        }))
      },
      bumpViews(id) {
        protectLocalChanges()
        setState((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === id ? { ...p, views: (p.views || 0) + 1 } : p,
          ),
        }))
      },
      async reportProduct({ productId, message }) {
        await createReport({ type: 'product', productId, message })
      },
      async reportShop({ shopId, message }) {
        await createReport({ type: 'shop', shopId, message })
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
        protectLocalChanges()
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
        protectLocalChanges()
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
        protectLocalChanges()
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
        protectLocalChanges()
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
        protectLocalChanges()
        setState((s) => ({
          ...s,
          shops: s.shops.map((x) => (x.id === shopId ? { ...x, trusted } : x)),
        }))
      },
    }),
    [state, user, myShop, adminOn, online, ready, syncReady, syncError, createReport],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
