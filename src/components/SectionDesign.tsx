import { motion } from 'framer-motion'

/**
 * Full-bleed editorial plates — image first, a single word of type, a hairline
 * caption. No paragraphs anywhere on the page.
 */
const PLATES = [
  { img: '/media/detail-engine.jpg', label: 'Powertrain', caption: '6.3 V12 · HY-KERS', pos: '50% 45%', full: false },
  { img: '/media/detail-cockpit.jpg', label: 'Cockpit', caption: 'Driver cell', pos: '50% 30%', full: false },
  { img: '/media/detail-wheel.jpg', label: 'Wheels', caption: '19" / 20" forged', pos: '50% 50%', full: false },
  { img: '/media/detail-nose.jpg', label: 'Aero', caption: 'Active surfaces', pos: '50% 50%', full: true },
]

export function SectionDesign() {
  return (
    <section id="design" className="bg-canvas">
      {PLATES.map((p, i) => (
        <figure
          key={p.label}
          className={`group relative w-full overflow-hidden ${p.full ? '' : 'h-[74svh] md:h-[88svh]'}`}
          style={p.full ? { aspectRatio: '2944 / 4820' } : undefined}
        >
          <motion.img
            src={p.img}
            alt={p.label}
            loading="lazy"
            initial={{ scale: 1.12 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 1.6, ease: [0.22, 0.61, 0.36, 1] }}
            className={p.full ? 'absolute inset-0 h-full w-full object-cover' : 'h-full w-full object-cover'}
            style={{ objectPosition: p.pos }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,24,0.5)_0%,rgba(24,24,24,0)_35%,rgba(24,24,24,0.85)_100%)]" />

          <figcaption className="absolute inset-x-0 bottom-0">
            <div className="shell flex items-end justify-between pb-10 md:pb-14">
              <div>
                <p className="text-[11px] font-semibold tracking-[1.1px] text-primary">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-4 text-[38px] font-medium leading-[1] tracking-[-1.3px] text-white md:text-[64px]">
                  {p.label}
                </h3>
              </div>
              <p className="hidden text-[10px] font-medium uppercase tracking-[2.4px] text-white/45 sm:block">
                {p.caption}
              </p>
            </div>
          </figcaption>
        </figure>
      ))}
    </section>
  )
}

export default SectionDesign
