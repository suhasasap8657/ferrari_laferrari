import { scrollToId } from '../lib/smoothScroll'

const COLUMNS: { title: string; links: { label: string; id?: string }[] }[] = [
  {
    title: 'LaFerrari',
    links: [
      { label: 'Overview', id: 'hero' },
      { label: '360°', id: 'sequence' },
      { label: 'Specification', id: 'specification' },
      { label: 'Detail', id: 'design' },
      { label: 'Film', id: 'film' },
    ],
  },
  {
    title: 'Ferrari',
    links: [
      { label: 'Models' },
      { label: 'Racing' },
      { label: 'Museums' },
      { label: 'Tailor Made' },
      { label: 'Store' },
    ],
  },
  {
    title: 'Follow',
    links: [{ label: 'Instagram' }, { label: 'YouTube' }, { label: 'X' }, { label: 'LinkedIn' }],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas px-6 pb-10 pt-14 md:px-12">
      <div className="shell !px-0">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-20">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-[10px] font-medium uppercase tracking-[2.4px] text-white">{c.title}</p>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.id ? (
                        <button
                          onClick={() => scrollToId(l.id as string, -64)}
                          className="text-body-sm text-body transition-colors hover:text-white"
                        >
                          {l.label}
                        </button>
                      ) : (
                        <span className="cursor-default text-body-sm text-muted-soft">{l.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
