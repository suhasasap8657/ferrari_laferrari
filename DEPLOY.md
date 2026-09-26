# Deploying to Vercel

Everything is pre-configured. Pick whichever path you prefer.

---

## 1 · Drag & drop (no CLI, ~2 minutes)

```bash
npm install
npm run build          # creates ./dist  (already the deployable output)
```

1. Open **https://vercel.com/new**
2. Drag the **`laferrari-scroll`** folder onto the page (or click *Deploy from CLI* → upload).
3. Vercel detects **Vite** → framework preset Vite, build `npm run build`, output `dist`.
4. **Deploy.** You get a `*.vercel.app` URL in about a minute.

*(Alternative: zip: right-click the folder → Compress, then on Vercel choose "Import" and drop the zip. Same result.)*

---

## 2 · CLI (best for repeat deploys)

```bash
npm i -g vercel
vercel login
vercel          # preview URL
vercel --prod   # production URL
```

---

## 3 · Git (auto-deploy on every push)

```bash
cd laferrari-scroll
git init && git add -A && git commit -m "LaFerrari immersive scroll site"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then **vercel.com → Add New → Project → Import Git Repository** → pick the repo → **Deploy**.
`.gitignore` already excludes `node_modules` and `dist`.

> Do **not** commit `node_modules`. The 31 MB of frames **must** be committed — they live in
> `public/media/`, not in a build artifact.

---

## What `vercel.json` already does

| Setting | Why |
| --- | --- |
| `framework: vite`, `dist` output | correct preset without dashboard fiddling |
| `/media/frames/*` → `max-age=31536000, immutable` | 1030 frames cached at the edge forever |
| `/assets/*` immutable | hashed JS/CSS never re-downloaded |
| SPA rewrite | anchor links and deep links never 404 |

---

## Post-deploy checklist

- [ ] Hero film autoplays muted (browsers require muted; users can enable sound in the film section).
- [ ] Scroll through the 360° section on a phone — it should use the lighter half-stride pass.
- [ ] Check the Network tab: the first ~86 frames arrive in one burst, the rest fill in behind them.
- [ ] Add a custom domain in **Settings → Domains** if you have one.

## If you need to shrink the payload further

| File | How |
| --- | --- |
| `public/media/frames/*.webp` | re-export at `q=60` at `960px` wide → ~19 MB total; or drop every other frame and set `stride: 2` |
| `public/media/film.mp4` | re-encode `-crf 31` or trim to a 60 s cut |
| `public/media/hero-loop.mp4` | already only ~4.8 MB (32 s, 1440×810, no audio) |

Re-encode command used for the film (adjust as needed):

```bash
ffmpeg -i source.mp4 -vf scale=1440:810 -c:v libx264 -preset slower -crf 29 \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -an film.mp4
```
