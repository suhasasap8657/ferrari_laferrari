import { useEffect, useRef, useState } from 'react'

/**
 * Engine zoom interaction — while the 360° sequence holds on the V12 close-up,
 * a Ferrari-style start button appears. Pressing it fires the ignition sound and
 * a row of rectangular bars reacts to it in real time (Web Audio analyser).
 */
const BARS = 32

export function EngineStart({ visible }: { visible: boolean }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const barsRef = useRef<(HTMLDivElement | null)[]>([])

  const stop = () => {
    const a = audioRef.current
    if (a) {
      a.pause()
      a.currentTime = 0
    }
    cancelAnimationFrame(rafRef.current)
    setPlaying(false)
    for (const el of barsRef.current) {
      if (el) el.style.transform = 'scaleY(0.08)'
    }
  }

  /* scrolled away → silence & reset so the moment can repeat on return */
  useEffect(() => {
    if (!visible) stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
      ctxRef.current?.close().catch(() => {})
    },
    [],
  )

  const ensureGraph = () => {
    if (audioRef.current) return audioRef.current
    const a = new Audio('/media/engine-start.mp3')
    a.preload = 'auto'
    a.onended = () => {
      cancelAnimationFrame(rafRef.current)
      setPlaying(false)
      for (const el of barsRef.current) {
        if (el) el.style.transform = 'scaleY(0.08)'
      }
    }
    const ctx = new AudioContext()
    const src = ctx.createMediaElementSource(a)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.82
    src.connect(analyser)
    analyser.connect(ctx.destination)
    audioRef.current = a
    ctxRef.current = ctx
    analyserRef.current = analyser
    dataRef.current = new Uint8Array(analyser.frequencyBinCount)
    return a
  }

  const start = async () => {
    const a = ensureGraph()
    const ctx = ctxRef.current!
    if (ctx.state === 'suspended') await ctx.resume()
    a.currentTime = 0
    try {
      await a.play()
    } catch {
      return
    }
    setPlaying(true)

    const analyser = analyserRef.current!
    const data = dataRef.current!
    cancelAnimationFrame(rafRef.current)
    const loop = () => {
      analyser.getByteFrequencyData(data)
      const bars = barsRef.current
      const bins = data.length
      const per = Math.max(1, Math.floor(bins / BARS))
      for (let i = 0; i < BARS; i++) {
        const el = bars[i]
        if (!el) continue
        let v = 0
        for (let j = 0; j < per; j++) {
          const s = data[Math.min(bins - 1, i * per + j)]
          if (s > v) v = s
        }
        el.style.transform = `scaleY(${(0.08 + (v / 255) * 0.92).toFixed(3)})`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-200 ease-ferrari ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!visible}
    >
      {/* Ferrari steering-wheel style ignition button */}
      <button
        type="button"
        onClick={() => (playing ? stop() : start())}
        disabled={!visible}
        aria-label={playing ? 'Stop engine' : 'Start engine'}
        className={`pointer-events-auto relative flex h-[104px] w-[104px] items-center justify-center rounded-full transition-all duration-300 ease-ferrari ${
          playing
            ? 'border-2 border-primary bg-[#181818]/70 backdrop-blur-sm'
            : 'border-2 border-white/25 bg-primary shadow-[0_0_0_6px_rgba(218,32,45,0.18),0_18px_50px_rgba(0,0,0,0.45)] hover:shadow-[0_0_0_10px_rgba(218,32,45,0.22),0_18px_60px_rgba(0,0,0,0.55)]'
        } ${visible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="absolute inset-[7px] rounded-full border border-white/20" />
        <span className="text-[12px] font-semibold uppercase tracking-[2.6px] text-white">
          {playing ? 'Stop' : 'Start'}
        </span>
      </button>

      <p
        className={`mt-5 text-[10px] font-medium uppercase tracking-[2.6px] transition-opacity duration-500 ${
          playing ? 'text-white/60 opacity-100' : 'text-white/45 opacity-100'
        }`}
      >
        {playing ? 'V12 · HY-KERS · 963 CV' : 'Engine'}
      </p>

      {/* rectangular sound-reaction bars — appear once the engine is running */}
      <div
        className={`mt-8 flex h-14 items-end gap-[4px] transition-opacity duration-700 ease-ferrari ${
          playing ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el
            }}
            className="h-full w-[5px] origin-bottom bg-primary"
            style={{ transform: 'scaleY(0.08)' }}
          />
        ))}
      </div>
    </div>
  )
}

export default EngineStart
