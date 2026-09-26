import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * `spec-cell` band — four numbers on the canvas, nothing else.
 * Counters are driven by a single rAF while in view and never re-mount.
 */
const SPECS = [
  { value: 963, suffix: 'CV', label: 'Total output' },
  { value: 800, suffix: 'CV', label: 'V12 alone' },
  { value: 900, suffix: 'Nm', label: 'Torque' },
  { value: 350, prefix: '>', suffix: 'km/h', label: 'Top speed' },
]

export function SectionSpecs() {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="specification" className="bg-canvas py-20 md:py-[110px]">
      <div ref={ref} className="shell grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-4">
        {SPECS.map((s, i) => (
          <NumberCell key={s.label} {...s} delay={i * 0.12} run={started} />
        ))}
      </div>
    </section>
  )
}

function NumberCell({
  value,
  suffix,
  label,
  prefix = '',
  delay,
  run,
}: {
  value: number
  suffix: string
  label: string
  prefix?: string
  delay: number
  run: boolean
}) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!run) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value)
      return
    }
    let raf = 0
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t
      const el = (t - start) / 1500 - delay
      const p = el <= 0 ? 0 : Math.min(1, el)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.8, delay: delay * 0.5, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <p className="text-[15vw] font-bold leading-[0.86] tracking-[-0.03em] text-white sm:text-[64px] lg:text-[80px]">
        {prefix}
        {n}
        <span className="ml-1 align-baseline text-[0.28em] font-medium tracking-[0.08em] text-body">
          {suffix}
        </span>
      </p>
      <p className="mt-5 text-[10px] font-medium uppercase tracking-[2.4px] text-white/45">{label}</p>
    </motion.div>
  )
}

export default SectionSpecs
