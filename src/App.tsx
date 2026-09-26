import { useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import ScrollSequence from './components/ScrollSequence'
import SectionSpecs from './components/SectionSpecs'
import SectionDesign from './components/SectionDesign'
import SectionFilm from './components/SectionFilm'
import Outro from './components/Outro'
import Footer from './components/Footer'
import Preloader from './components/Preloader'
import { useSmoothScroll } from './lib/smoothScroll'

export default function App() {
  useSmoothScroll()
  const [introDone, setIntroDone] = useState(false)

  return (
    <div className="relative min-h-screen bg-canvas">
      <a
        href="#sequence"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[120] focus:bg-white focus:px-4 focus:py-2 focus:text-body-on-light"
      >
        Skip to the 360°
      </a>

      <Nav />

      <main
        className={`transition-opacity duration-1000 ease-ferrari ${introDone ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!introDone}
      >
        <Hero />
        <ScrollSequence />
        <SectionSpecs />
        <SectionDesign />
        <SectionFilm />
        <Outro />
        <Footer />
      </main>

      <Preloader onDone={() => setIntroDone(true)} />
    </div>
  )
}
