import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type SequenceOptions = {
  count: number
  startAt?: number
  url: (n: number) => string
  stride?: number
  coarseStep?: number
  concurrency?: number
}

export type FrameSource = ImageBitmap | HTMLImageElement

export type Sequence = {
  frameAt: (progress: number) => { source: FrameSource; number: number } | null
  frameNumberAt: (progress: number) => number
  loaded: number
  ready: boolean
  onDecode: (cb: () => void) => () => void
}

export function useFrameSequence({
  count,
  startAt = 1,
  url,
  stride: manualStride,
  coarseStep: manualCoarse,
  concurrency: manualConcurrency,
}: SequenceOptions): Sequence {
  // Auto-detect low-power / mobile devices
  const isLowEnd = typeof window !== 'undefined' && (
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    window.matchMedia('(max-width: 860px)').matches ||
    ('deviceMemory' in navigator && (navigator as any).deviceMemory <= 4)
  )

  const stride = manualStride ?? (isLowEnd ? 2 : 1)
  const coarseStep = manualCoarse ?? (isLowEnd ? 24 : 12)
  const concurrency = manualConcurrency ?? (isLowEnd ? 2 : 5)
  const MAX_FINE_RESIDENT = isLowEnd ? 18 : 48

  const numbers = useMemo(() => {
    const out: number[] = []
    for (let n = startAt; n < startAt + count; n += stride) out.push(n)
    return out
  }, [count, startAt, stride])

  const coarseSet = useMemo(() => {
    const set = new Set<number>()
    for (let i = 0; i < numbers.length; i += coarseStep) {
      set.add(numbers[i])
    }
    return set
  }, [numbers, coarseStep])

  const frames = useRef<Map<number, FrameSource>>(new Map())
  const loadedNumbers = useRef<number[]>([])
  const subscribers = useRef<Set<() => void>>(new Set())
  const playhead = useRef(startAt)
  const lastDirection = useRef<1 | -1>(1)
  const lastPlayhead = useRef(startAt)
  const inFlight = useRef<Set<number>>(new Set())

  const [coarseDone, setCoarseDone] = useState(false)
  const [complete, setComplete] = useState(false)

  const onDecode = useCallback((cb: () => void) => {
    subscribers.current.add(cb)
    return () => {
      subscribers.current.delete(cb)
    }
  }, [])

  const insertSorted = (arr: number[], n: number) => {
    let lo = 0
    let hi = arr.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid] < n) lo = mid + 1
      else hi = mid
    }
    if (arr[lo] !== n) arr.splice(lo, 0, n)
  }

  useEffect(() => {
    let cancelled = false
    let coarseDecoded = 0
    const coarseTotal = coarseSet.size

    const fetchFrame = async (n: number): Promise<FrameSource | null> => {
      try {
        const response = await fetch(url(n))
        if (!response.ok) return null
        const blob = await response.blob()
        if (cancelled) return null

        if (typeof createImageBitmap === 'function') {
          return await createImageBitmap(blob)
        } else {
          return new Promise((resolve) => {
            const img = new Image()
            img.src = URL.createObjectURL(blob)
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
          })
        }
      } catch {
        return null
      }
    }

    const loadQueue = async () => {
      // 1. Tier-1 Anchor Ring First
      const coarseList = Array.from(coarseSet)
      for (let i = 0; i < coarseList.length; i += concurrency) {
        if (cancelled) return
        const batch = coarseList.slice(i, i + concurrency)
        await Promise.all(
          batch.map(async (n) => {
            if (frames.current.has(n)) return
            const src = await fetchFrame(n)
            if (src && !cancelled) {
              frames.current.set(n, src)
              insertSorted(loadedNumbers.current, n)
              coarseDecoded++
            }
          })
        )
        if (coarseDecoded >= Math.min(6, coarseTotal) && !coarseDone) {
          setCoarseDone(true)
        }
      }

      setCoarseDone(true)
      subscribers.current.forEach((cb) => cb())

      // 2. Fine-detail streaming loop (low CPU usage)
      const fineLoop = async () => {
        if (cancelled) return

        const head = playhead.current
        const dir = lastDirection.current

        const needed: number[] = []
        // Stream ahead in current scroll direction
        for (let offset = 1; offset <= 20; offset++) {
          const target = head + offset * dir * stride
          if (target >= startAt && target < startAt + count && !frames.current.has(target) && !inFlight.current.has(target)) {
            needed.push(target)
          }
        }

        if (needed.length > 0) {
          const toFetch = needed.slice(0, concurrency)
          toFetch.forEach((n) => inFlight.current.add(n))

          await Promise.all(
            toFetch.map(async (n) => {
              const src = await fetchFrame(n)
              inFlight.current.delete(n)
              if (src && !cancelled) {
                frames.current.set(n, src)
                insertSorted(loadedNumbers.current, n)
              }
            })
          )

          // Strict memory eviction for low-end devices
          if (frames.current.size > coarseTotal + MAX_FINE_RESIDENT) {
            frames.current.forEach((src, num) => {
              if (coarseSet.has(num)) return // Never evict anchors
              if (Math.abs(num - head) > 25) {
                if (typeof (src as ImageBitmap).close === 'function') {
                  ;(src as ImageBitmap).close()
                }
                frames.current.delete(num)
                const idx = loadedNumbers.current.indexOf(num)
                if (idx >= 0) loadedNumbers.current.splice(idx, 1)
              }
            })
          }
        }

        if (frames.current.size >= numbers.length) {
          setComplete(true)
        }

        if (!cancelled) {
          setTimeout(fineLoop, isLowEnd ? 60 : 30)
        }
      }

      fineLoop()
    }

    loadQueue()

    return () => {
      cancelled = true
      frames.current.forEach((f) => {
        if (typeof (f as ImageBitmap).close === 'function') (f as ImageBitmap).close()
      })
      frames.current.clear()
      loadedNumbers.current = []
      inFlight.current.clear()
    }
  }, [numbers, url, concurrency, coarseSet, startAt, count, stride, coarseDone, isLowEnd, MAX_FINE_RESIDENT])

  return useMemo<Sequence>(() => {
    const nearest = (n: number) => {
      const arr = loadedNumbers.current
      if (!arr.length) return null
      let lo = 0
      let hi = arr.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (arr[mid] < n) lo = mid + 1
        else hi = mid
      }
      const right = arr[lo]
      const left = arr[Math.max(0, lo - 1)]
      const pick = Math.abs(right - n) <= Math.abs(n - left) ? right : left
      const source = frames.current.get(pick)
      return source ? { source, number: pick } : null
    }

    const frameNumberAt = (progress: number) => {
      const p = Math.min(1, Math.max(0, progress))
      const exact = startAt + p * (count - 1)
      const snapped = Math.round((exact - startAt) / stride) * stride + startAt
      return Math.min(startAt + count - 1, Math.max(startAt, snapped))
    }

    return {
      frameAt: (progress: number) => {
        const n = frameNumberAt(progress)
        if (n !== lastPlayhead.current) {
          lastDirection.current = n > lastPlayhead.current ? 1 : -1
          lastPlayhead.current = n
        }
        playhead.current = n
        return nearest(n)
      },
      frameNumberAt,
      loaded: complete ? 1 : coarseDone ? 0.35 : 0.05,
      ready: coarseDone,
      onDecode,
    }
  }, [count, startAt, stride, coarseDone, complete, onDecode])
}
