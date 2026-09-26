import { motion } from 'framer-motion'

/** Closing plate: full-bleed still, one word, one CTA. */
export function Outro() {
  return (
    <section id="configure" className="relative h-[80svh] w-full overflow-hidden bg-canvas">
      <img
        src="/media/still-1.jpg"
        alt="LaFerrari"
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-canvas/55" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,24,0.9)_0%,rgba(24,24,24,0.25)_45%,rgba(24,24,24,0.95)_100%)]" />

      <div className="absolute inset-0 flex items-center">
        <div className="shell">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h2 className="max-w-[900px] text-[13vw] font-medium leading-[0.88] tracking-[-0.04em] text-white sm:text-[72px] lg:text-[104px]">
              LaFerrari
            </h2>
            <p className="mt-8 text-title-sm text-white/60">499 coupés · 210 Apertas · 2013–2018</p>
            <a
              href="https://www.ferrari.com/en-IN"
              target="_blank"
              rel="noreferrer noopener"
              className="btn-outline mt-10 inline-flex"
            >
              Ferrari.com
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Outro
