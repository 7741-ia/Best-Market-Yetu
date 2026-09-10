# Best Market Yetu

Vitrine pour vendeurs sans magasin en RDC. Achat via WhatsApp.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre http://127.0.0.1:5173/

## Déployer sur Vercel

1. Pousse le repo GitHub.
2. [vercel.com/new](https://vercel.com/new) → importe le projet.
3. Framework **Vite**, build `npm run build`, dossier `dist`.
4. (Optionnel) Variables d’environnement : voir `.env.example`.
5. Deploy. Les routes React (`/produit/...`) marchent grâce à `vercel.json`.

## Déployer sur Render

1. New → **Static Site** (ou Blueprint `render.yaml`).
2. Build : `npm install && npm run build`
3. Publish directory : `dist`
4. Rewrite : `/*` → `/index.html` (déjà dans `render.yaml` et `public/_redirects`).
