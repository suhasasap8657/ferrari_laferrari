import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Loading screen — the cavallino image only.
 * No spinner, no progress bar: just the image on black, then the site fades in.
 */
const MIN_VISIBLE_MS = 1600

export function Preloader({ onDone }: { onDone: () => void }) {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const started = performance.now()

    const finish = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started))
      window.setTimeout(() => {
        setGone(true)
        window.setTimeout(onDone, 800)
      }, wait)
    }

    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
    // Safety net: never trap the user on the loading screen.
    const bail = window.setTimeout(finish, 4500)
    return () => {
      window.removeEventListener('load', finish)
      window.clearTimeout(bail)
    }
  }, [onDone])

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] } }}
        >
          <motion.img
            src="/brand/loading-screen.png"
            alt="Ferrari"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Preloader
