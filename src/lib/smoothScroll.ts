import { useEffect } from 'react'
import Lenis from 'lenis'

let lenisInstance: Lenis | null = null

export function getLenis() {
  return lenisInstance
}

export function useSmoothScroll() {
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 860px)').matches || 'ontouchstart' in window
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    if (lenisInstance) {
      lenisInstance.destroy()
    }

    const lenis = new Lenis({
      duration: isMobile ? 0.8 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      // Use native touch physics on mobile/touch screens (ZERO input lag)
      touchMultiplier: 1.0,
      syncTouch: false,
      infinite: false,
    })

    lenisInstance = lenis

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

export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id)
  if (!el) return
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.2 })
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
