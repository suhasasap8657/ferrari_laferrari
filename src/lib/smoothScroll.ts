import { useEffect } from 'react'
import Lenis from 'lenis'

let lenisInstance: Lenis | null = null

export function getLenis() {
  return lenisInstance
}

/**
 * Buttery inertial scrolling — the backbone of the "seamless" feel.
 * Lenis performs real window scrolls, so `useScroll` from framer-motion,
 * sticky positioning and native anchoring all keep working.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const lenis = new Lenis({
      duration: 0.9,
      lerp: 0.16,
      wheelMultiplier: 1.15,
      touchMultiplier: 1.7,
      smoothWheel: true,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenisInstance = lenis

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])
}

/** Smoothly scroll to an element id (falls back to native when Lenis is off). */
export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id)
  if (!el) return
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.1 })
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
}

export function stopScroll(stopped: boolean) {
  const lenis = getLenis()
  if (lenis) stopped ? lenis.stop() : lenis.start()
  document.documentElement.style.overflow = stopped && !lenis ? 'hidden' : ''
}
