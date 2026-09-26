import { useAnimationFrame } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useFrameSequence } from '../lib/useFrameSequence'
import { EngineStart } from './EngineStart'

const FRAME_COUNT = 1030
const frameUrl = (n: number) => `/media/frames/frame_${String(n).padStart(4, '0')}.webp`

/** Three captions. */
const CHAPTERS = [
  { at: 0.22, index: '01', label: 'Silhouette' },
  { at: 0.5, index: '02', label: 'Powertrain' },
  { at: 0.78, index: '03', label: 'Cockpit' },
]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function ScrollSequence() {
  const trackRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // Direct DOM refs to eliminate React re-renders during scroll
  const hudFrameRef = useRef<HTMLSpanElement>(null)
  const hudBarRef = useRef<HTMLDivElement>(null)
  const engineStartRef = useRef<HTMLDivElement>(null)
  const captionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Cache dimensions to avoid reading layout on every frame
  const dims = useRef({ width: 0, height: 0, dpr: 1 })
  const painted = useRef(-1)
  const playhead = useRef(1)
  const [lowPower, setLowPower] = useState(false)

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

  const seqRef = useRef(seq)
  seqRef.current = seq

  /** Update cached canvas dimensions on resize only */
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)

    dims.current = { width: w, height: h, dpr }
    canvas.width = w
    canvas.height = h
    painted.current = -1
    draw(playhead.current, true)
  }

  /** Cover-fit blit directly to GPU buffer */
  const draw = (frameNumber: number, force = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sample = seqRef.current.frameAt((frameNumber - 1) / (FRAME_COUNT - 1))
    if (!sample) return
    if (!force && sample.number === painted.current) return

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true })
    }
    const ctx = ctxRef.current
    if (!ctx) return

    const src = sample.source
    const sw = (src as ImageBitmap).width ?? (src as HTMLImageElement).naturalWidth
    const sh = (src as ImageBitmap).height ?? (src as HTMLImageElement).naturalHeight
    if (!sw || !sh) return

    const cw = dims.current.width
    const ch = dims.current.height
    const scale = Math.max(cw / sw, ch / sh)
    const dw = sw * scale
    const dh = sh * scale

    if (force) {
      ctx.fillStyle = '#181818'
      ctx.fillRect(0, 0, cw, ch)
    }

    ctx.drawImage(src, (cw - dw) * 0.5, (ch - dh) * 0.5, dw, dh)
    painted.current = sample.number
  }

  /* ── Unified Single rAF Loop: zero layout thrashing, zero React re-renders ── */
  useAnimationFrame(() => {
    const track = trackRef.current
    if (!track || document.hidden) return

    const rect = track.getBoundingClientRect()
    const vh = window.innerHeight
    // Cull entirely when out of viewport
    if (rect.bottom < -80 || rect.top > vh + 80) return

    const scrollable = rect.height - vh
    const p = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0
    const target = 1 + p * (FRAME_COUNT - 1)

    // Smooth playhead chase
    const delta = target - playhead.current
    playhead.current += Math.abs(delta) < 0.2 ? delta : delta * 0.45
    const currentFrame = Math.round(playhead.current)

    // 1. Draw canvas
    draw(playhead.current)

    // 2. Update HUD directly via DOM (Zero React lag)
    if (hudFrameRef.current) {
      hudFrameRef.current.textContent = String(currentFrame).padStart(4, '0')
    }
    if (hudBarRef.current) {
      hudBarRef.current.style.transform = `scaleX(${p})`
    }

    // 3. Update Captions directly (Eliminated 3 separate rAF loops)
    const half = 0.13
    for (let i = 0; i < CHAPTERS.length; i++) {
      const el = captionRefs.current[i]
      if (!el) continue
      const chapter = CHAPTERS[i]
      const d = Math.abs(p - chapter.at) / half
      const opacity = clamp01(1 - d)

      if (opacity <= 0.005) {
        if (el.style.visibility !== 'hidden') {
          el.style.opacity = '0'
          el.style.visibility = 'hidden'
        }
      } else {
        if (el.style.visibility !== 'visible') {
          el.style.visibility = 'visible'
        }
        el.style.opacity = opacity.toFixed(3)
        el.style.transform = `translate3d(0, ${((p - chapter.at) * 60).toFixed(1)}px, 0)`
      }
    }

    // 4. Update EngineStart visibility (frames 380 - 455)
    if (engineStartRef.current) {
      const isVisible = currentFrame >= 380 && currentFrame <= 455
      engineStartRef.current.style.opacity = isVisible ? '1' : '0'
      engineStartRef.current.style.pointerEvents = isVisible ? 'auto' : 'none'
    }
  })

  // Repaint on fine frames decoding & on resize
  useEffect(() => {
    return seq.onDecode(() => {
      painted.current = -1
    })
  }, [seq])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas, { passive: true })
    return () => window.removeEventListener('resize', resizeCanvas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="sequence" className="relative bg-canvas">
      <div ref={trackRef} className="relative h-[320vh] md:h-[420vh]">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <canvas ref={canvasRef} className="h-full w-full" />

          {/* Depth scrims */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,24,0.82)_0%,rgba(24,24,24,0.05)_22%,rgba(24,24,24,0.05)_70%,rgba(24,24,24,0.88)_100%)]" />
          <div className="film-grain pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" />

          {/* Captions */}
          <div className="pointer-events-none absolute inset-0">
            <div className="shell flex h-full items-end pb-24 md:pb-28">
              <div className="relative w-full max-w-[560px]">
                {CHAPTERS.map((c, i) => (
                  <div
                    key={c.index}
                    ref={(el) => (captionRefs.current[i] = el)}
                    className="absolute inset-x-0 bottom-0 will-change-transform"
                    style={{ opacity: 0, visibility: 'hidden' }}
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <span className="text-[11px] font-semibold tracking-[1.1px] text-primary">{c.index}</span>
                      <span className="h-px w-10 bg-white/30" />
                    </div>
                    <h3 className="text-[40px] font-medium leading-[1] tracking-[-1.4px] text-white md:text-[68px]">
                      {c.label}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engine zoom */}
          <div
            ref={engineStartRef}
            className="transition-opacity duration-300"
            style={{ opacity: 0, pointerEvents: 'none' }}
          >
            <EngineStart visible={true} />
          </div>

          {/* Bottom rail: counter + sequence progress */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="shell pb-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[2.4px] text-white/45">
                  360°
                </span>
                <span
                  ref={hudFrameRef}
                  className="text-[10px] font-medium tabular-nums tracking-[2.4px] text-white/45"
                >
                  0001
                </span>
              </div>
              <div className="h-px w-full bg-white/12">
                <div
                  ref={hudBarRef}
                  className="h-px origin-left bg-primary"
                  style={{ transform: 'scaleX(0)', willChange: 'transform' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ScrollSequence
