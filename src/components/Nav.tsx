import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useEffect, useState } from 'react'
import { scrollToId, stopScroll } from '../lib/smoothScroll'

const MENU = [
  { label: 'Overview', id: 'hero' },
  { label: '360°', id: 'sequence' },
  { label: 'Specification', id: 'specification' },
  { label: 'Detail', id: 'design' },
  { label: 'Film', id: 'film' },
]

/**
 * Pixel-matched to the official strip: 39px tall, #1e1e1e,
 * 13px/600 uppercase white links, ~25px cavallino left.
 */
export function Nav() {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setSolid(v > 40))

  useEffect(() => {
    stopScroll(open)
    return () => stopScroll(false)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    stopScroll(false)
    window.setTimeout(() => scrollToId(id, -28), 120)
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 bg-[#1e1e1e] transition-colors duration-500 ease-ferrari ${
          solid ? 'border-b border-white/10' : 'border-b border-transparent'
        }`}
      >
        <nav className="flex h-7 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-10">
            <button onClick={() => go('hero')} aria-label="LaFerrari — back to top" className="flex items-center">
              <img src="/brand/cavallino-silver.png" alt="Ferrari" className="h-6 w-auto" />
            </button>

            <ul className="hidden items-center gap-8 lg:flex">
              {MENU.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => go(m.id)}
                    className="text-nav-link uppercase text-white/85 transition-colors hover:text-white"
                  >
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://www.ferrari.com/en-IN"
              target="_blank"
              rel="noreferrer noopener"
              className="hidden text-nav-link uppercase text-white/85 transition-colors hover:text-white md:block"
            >
              Ferrari.com
            </a>
            <button
              className="relative z-50 flex h-9 w-9 items-center justify-center lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <span className="relative block h-3 w-6">
                <span
                  className={`absolute left-0 h-px w-6 bg-white transition-all duration-300 ${
                    open ? 'top-1.5 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-6 bg-white transition-all duration-300 ${
                    open ? 'top-1.5 -rotate-45' : 'top-3'
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-center bg-canvas px-8 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <ul className="space-y-6">
              {MENU.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.045, duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <button
                    onClick={() => go(m.id)}
                    className="text-[28px] font-medium uppercase tracking-[0.5px] text-white"
                  >
                    {m.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Nav
