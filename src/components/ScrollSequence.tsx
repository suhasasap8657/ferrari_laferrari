import { useAnimationFrame } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useFrameSequence } from '../lib/useFrameSequence'
import { EngineStart } from './EngineStart'

const FRAME_COUNT = 1030
const frameUrl = (n: number) => `/media/frames/frame_${String(n).padStart(4, '0')}.webp`

/** Three captions. Nothing else — the imagery carries the section. */
const CHAPTERS = [
  { at: 0.22, index: '01', label: 'Silhouette' },
  { at: 0.5, index: '02', label: 'Powertrain' },
  { at: 0.78, index: '03', label: 'Cockpit' },
]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function ScrollSequence() {
  const trackRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /** last painted frame — avoids redundant blits */
  const painted = useRef(-1)
  /** sub-frame playhead that chases the scroll position */
  const playhead = useRef(1)
  const [lowPower, setLowPower] = useState(false)
  const [hud, setHud] = useState({ frame: 1, progress: 0 })
  const hudTick = useRef(0)

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    setLowPower(window.matchMedia('(max-width: 860px)').matches || cores <= 4)
  }, [])

  const stride: 1 | 2 = lowPower ? 2 : 1
  const seq = useFrameSequence({
    count: FRAME_COUNT,
    startAt: 1,
    url: frameUrl,
    stride,
    coarseStep: lowPower ? 18 : 10,
    concurrency: lowPower ? 6 : 10,
  })
  // keep a ref so the rAF loop never closes over a stale sequence object
  const seqRef = useRef(seq)
  seqRef.current = seq

  /** Cover-fit blit — a single drawImage from a decoded bitmap. */
  const draw = (frameNumber: number, force = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sample = seqRef.current.frameAt((frameNumber - 1) / (FRAME_COUNT - 1))
    if (!sample) return
    if (!force && sample.number === painted.current) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      force = true // resizing clears the canvas
    }

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    const src = sample.source
    const sw = (src as ImageBitmap).width ?? (src as HTMLImageElement).naturalWidth
    const sh = (src as ImageBitmap).height ?? (src as HTMLImageElement).naturalHeight
    const scale = Math.max(canvas.width / sw, canvas.height / sh)
    const dw = sw * scale
    const dh = sh * scale

    if (force) {
      ctx.fillStyle = '#dcdcdc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(src, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
    painted.current = sample.number
  }

  /* ── one rAF loop: read scroll → chase → blit ────────────────────────── */
  useAnimationFrame(() => {
    const track = trackRef.current
    if (!track || document.hidden) return

    const rect = track.getBoundingClientRect()
    const vh = window.innerHeight
    // cull entirely when the section is off-screen
    if (rect.bottom < -80 || rect.top > vh + 80) return

    const scrollable = rect.height - vh
    const p = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0
    const target = 1 + p * (FRAME_COUNT - 1)

    // Chase the target so discrete wheel steps read as continuous rotation.
    const delta = target - playhead.current
    playhead.current += Math.abs(delta) < 0.4 ? delta : delta * 0.45
    draw(playhead.current)

    // HUD refresh ~8×/s — never a React render per animation frame
    const now = performance.now()
    if (now - hudTick.current > 120) {
      hudTick.current = now
      const f = Math.round(playhead.current)
      setHud((prev) => (prev.frame === f ? prev : { frame: f, progress: p }))
    }
  })

  // repaint with sharper frames as the fine pass streams in, and on resize
  useEffect(
    () =>
      seq.onDecode(() => {
        painted.current = -1
      }),
    [seq],
  )

  useEffect(() => {
    const onResize = () => {
      painted.current = -1
      draw(playhead.current, true)
    }
    window.addEventListener('resize', onResize)
    draw(playhead.current, true)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="sequence" className="relative bg-canvas">
      <div ref={trackRef} className="relative h-[320vh] md:h-[420vh]">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <canvas ref={canvasRef} className="h-full w-full" />

          {/* Photographic depth only — a soft scrim top and bottom, no flat wash. */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,24,0.82)_0%,rgba(24,24,24,0.05)_22%,rgba(24,24,24,0.05)_70%,rgba(24,24,24,0.88)_100%)]" />
          <div className="film-grain pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" />

          {/* Captions — a hairline, a number, one word. */}
          <div className="pointer-events-none absolute inset-0">
            <div className="shell flex h-full items-end pb-24 md:pb-28">
              <div className="relative w-full max-w-[560px]">
                {CHAPTERS.map((c) => (
                  <Caption key={c.index} chapter={c} />
                ))}
              </div>
            </div>
          </div>

          {/* Engine zoom: start button + live sound bars (frames ≈375–465) */}
          <EngineStart visible={hud.frame >= 380 && hud.frame <= 455} />

          {/* Bottom rail: counter + sequence progress */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="shell pb-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[2.4px] text-white/45">
                  360°
                </span>
                <span className="text-[10px] font-medium tabular-nums tracking-[2.4px] text-white/45">
                  {String(hud.frame).padStart(4, '0')}
                </span>
              </div>
              <div className="h-px w-full bg-white/12">
                <div
                  className="h-px origin-left bg-primary"
                  style={{ transform: `scaleX(${hud.progress})`, transition: 'transform 120ms linear' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Caption driven by the same rAF cadence as the canvas — it fades in around its
 * slice and out again, so two captions are never on screen together.
 */
function Caption({ chapter }: { chapter: { at: number; index: string; label: string } }) {
  const ref = useRef<HTMLDivElement>(null)

  useAnimationFrame(() => {
    const el = ref.current
    if (!el || document.hidden) return
    const track = el.closest('section')?.querySelector('[data-track]') as HTMLElement | null
    void track
    const host = el.closest('.sticky')?.parentElement as HTMLElement | null
    if (!host) return
    const rect = host.getBoundingClientRect()
    const scrollable = rect.height - window.innerHeight
    if (scrollable <= 0) return
    const p = clamp01(-rect.top / scrollable)
    // triangular window centred on the chapter's position
    const half = 0.13
    const d = Math.abs(p - chapter.at) / half
    const opacity = clamp01(1 - d)
    if (opacity === 0) {
      el.style.opacity = '0'
      el.style.visibility = 'hidden'
    } else {
      el.style.visibility = 'visible'
      el.style.opacity = String(opacity)
      el.style.transform = `translate3d(0, ${((p - chapter.at) * 60).toFixed(2)}px, 0)`
    }
  })

  return (
    <div ref={ref} className="absolute inset-x-0 bottom-0 will-change-transform" style={{ opacity: 0, visibility: 'hidden' }}>
      <div className="mb-5 flex items-center gap-4">
        <span className="text-[11px] font-semibold tracking-[1.1px] text-primary">{chapter.index}</span>
        <span className="h-px w-10 bg-white/30" />
      </div>
      <h3 className="text-[40px] font-medium leading-[1] tracking-[-1.4px] text-white md:text-[68px]">
        {chapter.label}
      </h3>
    </div>
  )
}

export default ScrollSequence
