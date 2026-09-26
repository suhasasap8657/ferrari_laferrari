import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type SequenceOptions = {
  count: number
  startAt?: number
  url: (n: number) => string
  stride?: number
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
  stride = 4,
}: SequenceOptions): Sequence {
  // Generate the active frame numbers (e.g. 1, 5, 9, 13...) -> ~258 frames total
  const numbers = useMemo(() => {
    const out: number[] = []
    for (let n = startAt; n < startAt + count; n += stride) out.push(n)
    return out
  }, [count, startAt, stride])

  const frames = useRef<Map<number, FrameSource>>(new Map())
  const loadedNumbers = useRef<number[]>([])
  const subscribers = useRef<Set<() => void>>(new Set())
  const [ready, setReady] = useState(false)
  const [loadedRatio, setLoadedRatio] = useState(0)

  const onDecode = useCallback((cb: () => void) => {
    subscribers.current.add(cb)
    return () => subscribers.current.delete(cb)
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
    let decodedCount = 0
    const total = numbers.length

    const fetchFrame = (n: number): Promise<FrameSource | null> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.src = url(n)
        img.onload = async () => {
          if (cancelled) return resolve(null)
          if (typeof createImageBitmap === 'function') {
            try {
              const bmp = await createImageBitmap(img)
              return resolve(bmp)
            } catch {
              return resolve(img)
            }
          }
          resolve(img)
        }
        img.onerror = () => resolve(null)
      })
    }

    const loadAll = async () => {
      // 1. First load every 4th frame of the sequence (coarse baseline in ~300ms)
      const coarseBatch = numbers.filter((_, i) => i % 4 === 0)
      await Promise.all(
        coarseBatch.map(async (n) => {
          const src = await fetchFrame(n)
          if (src && !cancelled) {
            frames.current.set(n, src)
            insertSorted(loadedNumbers.current, n)
          }
        })
      )

      if (!cancelled) {
        setReady(true)
        subscribers.current.forEach((cb) => cb())
      }

      // 2. Stream the remaining frames in fast batches of 8
      const remaining = numbers.filter((_, i) => i % 4 !== 0)
      const BATCH_SIZE = 8

      for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
        if (cancelled) return
        const batch = remaining.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async (n) => {
            const src = await fetchFrame(n)
            if (src && !cancelled) {
              frames.current.set(n, src)
              insertSorted(loadedNumbers.current, n)
              decodedCount++
            }
          })
        )
        setLoadedRatio(decodedCount / total)
      }
    }

    loadAll()

    return () => {
      cancelled = true
      frames.current.forEach((f) => {
        if (typeof (f as ImageBitmap).close === 'function') (f as ImageBitmap).close()
      })
      frames.current.clear()
      loadedNumbers.current = []
    }
  }, [numbers, url])

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
        return nearest(n)
      },
      frameNumberAt,
      loaded: loadedRatio,
      ready,
      onDecode,
    }
  }, [count, startAt, stride, loadedRatio, ready, onDecode])
}
