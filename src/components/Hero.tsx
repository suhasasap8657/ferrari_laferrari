import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { scrollToId } from '../lib/smoothScroll'

/**
 * hero-band-cinema — three-clip rotation:
 *  1. the original loop, cut at 20 s
 *  2. the NFS-style clip, cut at 10 s
 *  3. the official intro, played to the end
 * then back to 1, forever.
 */
const CLIPS: { src: string; stopAt: number | null }[] = [
  { src: '/media/hero-loop.mp4', stopAt: 20 },
  { src: '/media/hero-clip-2.mp4', stopAt: 10 },
  { src: '/media/hero-clip-3.mp4', stopAt: null },
]

export function Hero() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return
      if (i === active) {
        v.currentTime = 0
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [active])

  const next = () => setActive((i) => (i + 1) % CLIPS.length)

  return (
    <section id="hero" className="relative h-[100svh] w-full overflow-hidden bg-black">
      {CLIPS.map((c, i) => (
        <video
          key={c.src}
          ref={(el) => {
            refs.current[i] = el
          }}
          src={c.src}
          poster={i === 0 ? '/media/hero-poster.jpg' : undefined}
          autoPlay={i === 0}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-label="LaFerrari driving film"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-ferrari ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
          onTimeUpdate={(e) => {
            if (i === active && c.stopAt !== null && e.currentTarget.currentTime >= c.stopAt) next()
          }}
          onEnded={() => {
            if (i === active) next()
          }}
        />
      ))}

      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-14 text-center md:pb-16">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-title-sm text-white"
        >
          Ferrari
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
          className="mt-2 text-display-xl uppercase md:text-display-mega text-white"
        >
          LaFerrari
        </motion.h1>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          onClick={() => scrollToId('sequence', -28)}
          className="group mt-12 flex items-center gap-4"
          aria-label="Discover the LaFerrari"
        >
          <span className="text-[12px] font-medium uppercase tracking-[1.4px] text-white/90 transition-colors group-hover:text-white">
            Discover
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 transition-all duration-300 ease-ferrari group-hover:border-white group-hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2.5 8h10.5M9.5 3.8 13.7 8l-4.2 4.2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              />
            </svg>
          </span>
        </motion.button>
      </div>
    </section>
  )
}

export default Hero
