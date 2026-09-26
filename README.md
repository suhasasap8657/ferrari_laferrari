# LaFerrari — Immersive Scroll Site

A cinematic, single-car tribute site built with **React 18 + Vite + TypeScript**, implementing the
**Ferrari design language** (Rosso Corsa `#da291c`, near-black canvas `#181818`, sharp 0px corners,
uppercase 1.4px-tracked CTAs, the 8px spacing ladder) with **two headline interactions**:

1. **Scroll-scrubbed 360° animation** — your 1,030 supplied frames are painted to a `<canvas>` frame
   by frame as you scroll, with inertial scrolling (Lenis) and a spring-smoothed frame index.
2. **Looping film** — your supplied footage plays silently on loop as the full-bleed hero, in a
   dedicated film section with player controls and scene markers, and as a full-screen
   "film mode" overlay reachable from the sequence.

> **Live preview:** `npm run dev` → http://localhost:5173 · production build → `npm run preview`
> (http://localhost:4173)

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Requires Node 18+ (Node 20 recommended).

---

## Deploy to Vercel (two ways)

### A. Dashboard — drag & drop (fastest)

1. Run `npm install && npm run build` locally.
2. Go to **vercel.com → Add New → Project → Deploy from CLI / upload**, or drag the project folder
   onto https://vercel.com/new.
3. Vercel auto-detects **Vite** (build `npm run build`, output `dist`). Click **Deploy**.

### B. Git + CLI (recommended for repeat deploys)

```bash
npm i -g vercel
vercel login
vercel          # preview deployment
vercel --prod   # production deployment
```

`vercel.json` is already included and sets:

- `framework: vite`, build command, output directory
- immutable 1-year caching for `/media/frames/*` and `/assets/*` (1030 images → CDN-friendly)
- SPA rewrite so client-side routes/anchors never 404

> **Upload size:** the project ships ~31 MB of frames + ~7 MB of video, well inside Vercel's limits.
> If you swap in a longer film, keep each file under the 100 MB static-asset ceiling.

---

## Project structure

```
laferrari-scroll/
├─ public/
│  ├─ favicon.svg
│  └─ media/
│     ├─ frames/              # 1030 WebP frames (frame_0001 … frame_1030)
│     ├─ hero-loop.mp4/.webm  # 32 s hero loop, muted, faststart (MP4 + VP9 fallback)
│     ├─ film.mp4/.webm       # full 2:34 film (MP4 + VP9 fallback)
│     ├─ hero-poster.jpg      # poster for the hero loop + OG image
│     ├─ film-poster.jpg      # poster for the film section
│     ├─ still-0…3.jpg        # scene thumbnails in the film rail
│     └─ detail-*.jpg         # 4:5 crops used in the design grid
├─ src/
│  ├─ App.tsx                 # page composition + smooth scroll + scroll bar
│  ├─ index.css               # tokens, base styles, component classes
│  ├─ lib/
│  │  ├─ smoothScroll.ts      # Lenis instance + scrollToId helpers
│  │  └─ useFrameSequence.ts  # coarse→fine frame loader with nearest-frame fallback
│  └─ components/
│     ├─ Preloader.tsx        # shield curtain + progress, hands off to hero
│     ├─ Nav.tsx              # 64px nav, scroll-condensing, mobile overlay menu
│     ├─ Hero.tsx             # cinematic full-bleed looping film + display-mega headline
│     ├─ ScrollSequence.tsx   # ★ canvas 360° scrub + chapters + HUD + film mode
│     ├─ SectionSpecs.tsx     # number-display counters + hairline spec table
│     ├─ SectionDesign.tsx    # light editorial band + Rosso Corsa livery band
│     ├─ SectionFilm.tsx      # looping film player, scene rail, download
│     ├─ SectionHeritage.tsx  # timeline + continuous ticker
│     ├─ SectionConfigure.tsx # livery picker + register form (newsletter band)
│     ├─ Footer.tsx           # 5-column dark footer
│     ├─ ShieldMark.tsx       # original stylised shield mark (SVG, drawn from scratch)
│     └─ ui.tsx               # Reveal / Counter / SectionLabel primitives
├─ tailwind.config.js         # every Ferrari token from the extracted spec
├─ vercel.json
└─ vite.config.ts
```

---

## How the 360° scroll animation works

`src/lib/useFrameSequence.ts` + `src/components/ScrollSequence.tsx`

| Concern | Solution |
| --- | --- |
| Never shows a blank canvas | Frames load in two passes: every 12th frame first (≈86 images → the whole orbit is scrubbable almost immediately), then the gaps fill in. Drawing always falls back to the **nearest decoded frame**. |
| Buttery motion | Lenis smooth scrolling + `useSpring` on `scrollYProgress` (stiffness 260 / damping 42), so wheel steps never look steppy. |
| Frame budget | Repaints are coalesced to ≤50 fps and skipped when the frame index hasn't changed; DPR is capped at 2. |
| Mobile / weak hardware | Detected via `matchMedia` + `hardwareConcurrency` → stride 2 (≈515 frames), lower concurrency, coarser first pass. |
| Battery | The loader stops repainting when the tab is hidden; the film pauses off-screen via `IntersectionObserver`. |
| Crisp on scroll end | A 220 ms interval repaints with the sharpest available frame, so the car always settles perfectly sharp. |
| Reversible | Everything is driven by scroll position, so scrolling up runs the rotation backwards seamlessly. |

Swap the source frames by dropping new files in `public/media/frames/` as
`frame_0001.webp … frame_1030.webp` and changing `FRAME_COUNT` in `ScrollSequence.tsx`.

---

## Performance notes

- 1,030 frames re-encoded from PNG → **WebP q68 @ 1280×720: 641 MB → 31 MB**.
- Videos re-encoded with `libx264` + `-movflags +faststart` (48.8 MB source → **4.8 MB** 32 s hero loop and **18.7 MB** full film), audio stripped so autoplay is never blocked.
- Each video also has a **WebM/VP9 source**: listed second, so it is never downloaded unless the browser cannot decode H.264 (rare Linux builds). Delete the `.webm` files and their `<source>` lines if you want a leaner repo.
- Both hero and film carry posters, so something meaningful paints before a single byte of video arrives.
- Only ~104 KB gzipped JS on first load; Tailwind purges to a ~6.9 KB gzipped stylesheet.
- All imagery below the fold is `loading="lazy"`; the film's `preload="metadata"` means the 18 MB never downloads until the section is in view.

---

## Design tokens (from `ferrari-DESIGN`)

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#da291c` Rosso Corsa | Primary CTAs, section markers, progress |
| `canvas` | `#181818` | Page floor (never pure black) |
| `canvas-elevated` | `#303030` | Cards, panels |
| `canvas-light` | `#ffffff` | Editorial band (design/detail) |
| `body` | `#969696` | Running text |
| `hairline` | `#303030` | 1px dividers |
| Display | 80/56/36/26 px, weight **500** | Never bold display copy |
| CTA | 14px/700, uppercase, **1.4px** tracking | Sharp `0px` corners |
| Radius | `0px` everywhere except badges (`9999px`) | Brand precision |

---

## Assets & licensing

- **Your assets:** the frames, hero film and any stills were supplied by you via the shared Drive
  folder and are re-encoded here for the web. You own/control their use.
- **Ferrari trademarks:** *Ferrari*, *LaFerrari*, the *Cavallino Rampante* and the shield device are
  trademarks of Ferrari S.p.A. The shield mark bundled in `ShieldMark.tsx` is an **original
  geometric interpretation drawn from scratch** for demonstration purposes — it is not the official
  logo and no official Ferrari artwork, font or asset is redistributed with this project.
  This is an unofficial fan/tribute build and is not affiliated with or endorsed by Ferrari.
- **Typeface:** FerrariSans is licensed and not bundled. The design spec itself documents
  **Inter at weight 500** as the open-source substitute, which is what ships here
  (`@fontsource-variable/inter`, self-hosted — no external font CDN).
- If you intend to make this public, add your own attribution/notice and keep the footer disclaimer.
# ferrari_laferrari
