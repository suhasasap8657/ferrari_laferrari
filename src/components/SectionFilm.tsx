import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function fmt(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Full-bleed looping film. Caption only, all controls are glyphs.
 */
export function SectionFilm() {
  const ref = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(154.5)
  const [barHover, setBarHover] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setTime(v.currentTime)
    const onMeta = () => Number.isFinite(v.duration) && setDuration(v.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration)

    // only decode while the film is actually on screen
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? v.play().catch(() => undefined) : v.pause()),
      { threshold: 0.3 },
    )
    io.observe(v)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      io.disconnect()
    }
  }, [])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play().catch(() => undefined) : v.pause()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    if (!v.muted) v.play().catch(() => undefined)
  }

  return (
    <section id="film" ref={ref} className="relative bg-canvas">
      <div className="relative h-[100svh] w-full overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster="/media/film-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="LaFerrari film, looping"
        >
          <source src="/media/film.mp4" type="video/mp4" />
        </video>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,24,0.55)_0%,rgba(24,24,24,0)_30%,rgba(24,24,24,0)_55%,rgba(24,24,24,0.9)_100%)]" />

        {/* one line, bottom-left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0"
        >
          <div className="shell pb-24 md:pb-28">
            <p className="text-[11px] font-semibold tracking-[1.1px] text-primary">04</p>
            <h3 className="mt-4 text-[38px] font-medium leading-[1] tracking-[-1.3px] text-white md:text-[68px]">
              The Film
            </h3>
          </div>
        </motion.div>

        {/* controls — glyphs only, no labels */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="shell pb-8">
            <div className="flex items-center gap-5">
              <button
                onClick={toggle}
                aria-label={playing ? 'Pause film' : 'Play film'}
                className="flex h-11 w-11 items-center justify-center border border-white/40 backdrop-blur-sm transition-colors duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current text-white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleMute}
                aria-label={muted ? 'Unmute film' : 'Mute film'}
                className="flex h-11 w-11 items-center justify-center border border-white/40 backdrop-blur-sm transition-colors duration-300 hover:border-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                  <path d="M4 9v6h3l5 4V5L7 9H4z" />
                  {muted ? (
                    <path d="M16.5 8.5l5 7M21.5 8.5l-5 7" stroke="#fff" strokeWidth="1.7" fill="none" />
                  ) : (
                    <path d="M16 8.5c1.6 1.6 1.6 5.4 0 7M18.6 6.2c2.8 2.8 2.8 8.8 0 11.6" stroke="#fff" strokeWidth="1.7" fill="none" />
                  )}
                </svg>
              </button>

              <span className="text-[10px] font-medium tabular-nums tracking-[2.4px] text-white/50">
                {fmt(time)} / {fmt(duration)}
              </span>

              <div
                className="ml-auto flex h-11 flex-1 cursor-pointer items-center"
                onMouseEnter={() => setBarHover(true)}
                onMouseLeave={() => setBarHover(false)}
                onClick={(e) => {
                  const v = videoRef.current
                  if (!v) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  v.currentTime = ((e.clientX - rect.left) / rect.width) * duration
                  v.play().catch(() => undefined)
                }}
              >
                <div className={`h-px w-full bg-white/25 transition-all duration-300 ${barHover ? 'h-[3px]' : ''}`}>
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (time / duration) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionFilm
