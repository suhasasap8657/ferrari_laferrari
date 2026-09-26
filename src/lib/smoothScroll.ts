import { useEffect } from 'react'
import Lenis from 'lenis'

let lenisInstance: Lenis | null = null

export function getLenis() {
  return lenisInstance
}

/**
 * Luxury Inertial Scrolling Engine
 * Tuned specifically for heavy-weight automotive sequence scrubs.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    // Clean up any stale instance
    if (lenisInstance) {
      lenisInstance.destroy()
    }

    const lenis = new Lenis({
      // 1.25s duration gives a heavy, gliding inertia curve (Apple/Porsche feel)
      duration: 1.25,
      // Exponential out easing: starts responsive, glides to a silky stop
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      // 0.88 softens harsh mechanical mouse notches into fluid motion
      wheelMultiplier: 0.88,
      touchMultiplier: 1.2,
      infinite: false,
    })

    lenisInstance = lenis

    // Frame-rate independent animation loop
    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
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
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
  }
}

export function stopScroll(stopped: boolean) {
  const lenis = getLenis()
  if (lenis) {
    stopped ? lenis.stop() : lenis.start()
  }
  document.documentElement.style.overflow = stopped && !lenis ? 'hidden' : ''
}
