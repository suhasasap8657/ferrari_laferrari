/**
 * Image-sequence engine for the scroll-scrubbed 360° animation.
 *
 * Loading strategy (keeps the scrub seamless on any connection):
 *  1. Coarse pass — every `coarseStep`-th frame first, so the whole orbit is
 *     scrubbable within a second or two.
 *  2. Fine pass — the remaining frames stream in behind the wheel.
 *  3. Drawing always falls back to the *nearest already-decoded* frame, so the
 *     canvas never flickers white and never waits on the network.
 *
 * Performance notes (this is what makes the scrub smooth):
 *  - All frames are decoded up-front via `img.decode()` and then drawn from a
 *    pre-rendered **ImageBitmap**. Drawing a bitmap is a straight GPU blit with
 *    no decode/scale work on the main thread — decoding an HTMLImageElement
 *    mid-scroll was the cause of the jitter.
 *  - Frames are fetched through a small concurrency gate; ordering is
 *    "nearest to the current playhead first", so whatever direction you scroll,
 *    the next frames you need are already resident.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type SequenceOptions = {
  /** total number of frames in the sequence (source numbering, inclusive) */
  count: number
  /** first frame number in the file name, e.g. 1 → frame_0001.webp */
  startAt?: number
  /** URL builder for a 1-based frame number */
  url: (n: number) => string
  /** fetch every Nth frame (low-power devices use 2) */
  stride?: number
  /** every Nth frame loaded in the first (coarse) pass */
  coarseStep?: number
  /** parallel image requests */
  concurrency?: number
}

export type FrameSource = ImageBitmap | HTMLImageElement

export type Sequence = {
  /** nearest already-decoded frame for a normalised position 0..1 */
  frameAt: (progress: number) => { source: FrameSource; number: number } | null
  /** exact source frame number for a normalised position 0..1 */
  frameNumberAt: (progress: number) => number
  /** 0..1 — how much of the fetch list has decoded. Repaints the UI only on
   *  this state change (twice per pass), never per frame. */
  loaded: number
  /** at least the coarse pass has finished */
  ready: boolean
  /** subscribe to decode events (used to repaint with sharper frames) */
  onDecode: (cb: () => void) => () => void
}

export function useFrameSequence({
  count,
  startAt = 1,
  url,
  stride = 1,
  coarseStep = 12,
  concurrency = 6,
}: SequenceOptions): Sequence {
  const numbers = useMemo(() => {
    const out: number[] = []
    for (let n = startAt; n < startAt + count; n += stride) out.push(n)
    return out
  }, [count, startAt, stride])

  const frames = useRef<Map<number, FrameSource>>(new Map())
  const loadedNumbers = useRef<number[]>([])
  const subscribers = useRef(new Set<() => void>())
  /** playhead set by the scroll loop — drives load priority */
  const playhead = useRef(startAt)

  // Coarse→fine ordering, but re-prioritised around the playhead as it moves.
  const pending = useRef<number[]>([])
  const queued = useRef<Set<number>>(new Set())

  const [coarseDone, setCoarseDone] = useState(false)
  const [complete, setComplete] = useState(false)

  const onDecode = useCallback((cb: () => void) => {
    subscribers.current.add(cb)
    return () => {
      subscribers.current.delete(cb)
    }
  }, [])

  /** Insert a freshly fetched frame number into the sorted array. */
  const insertSorted = (arr: number[], n: number) => {
    let lo = 0
    let hi = arr.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid] < n) lo = mid + 1
      else hi = mid
    }
    arr.splice(lo, 0, n)
  }

  useEffect(() => {
    let cancelled = false

    // ── build the fetch plan: coarse ring first, then the rest ────────────
    const coarse: number[] = []
    for (let i = 0; i < numbers.length; i += coarseStep) coarse.push(numbers[i])
    const coarseSet = new Set(coarse)
    const fine = numbers.filter((n) => !coarseSet.has(n))

    pending.current = [...coarse, ...fine]
    queued.current = new Set(pending.current)

    let decoded = 0
    const coarseTotal = coarse.length
    let publishes = 0

    const notify = () => subscribers.current.forEach((cb) => cb())

    const fetchOne = async (n: number) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = url(n)
      try {
        await img.decode()
      } catch {
        // decode() rejects on some browsers; fall back to a load probe
        const ok = await new Promise<boolean>((res) => {
          if (img.complete && img.naturalWidth) return res(true)
          img.onload = () => res(true)
          img.onerror = () => res(false)
        })
        if (!ok) return
      }
      if (cancelled) return

      // Prefer an ImageBitmap: blitting a bitmap to canvas costs nothing,
      // whereas drawing an <img> can re-run decode/scale on the main thread.
      let source: FrameSource = img
      if (typeof createImageBitmap === 'function') {
        try {
          source = await createImageBitmap(img)
        } catch {
          source = img
        }
      }
      if (cancelled) {
        if (typeof (source as ImageBitmap).close === 'function') (source as ImageBitmap).close()
        return
      }

      frames.current.set(n, source)
      insertSorted(loadedNumbers.current, n)
      decoded += 1

      // ── resident-memory budget ─────────────────────────────────────
      // A decoded 4K bitmap is ~33 MB; 1030 of them would OOM the tab.
      // Keep only the frames nearest the playhead resident: evict the
      // farthest one and re-queue it so it can be re-fetched on demand.
      const MAX_RESIDENT = 48
      if (frames.current.size > MAX_RESIDENT) {
        let worstN = -1
        let worstD = -1
        frames.current.forEach((_src, num) => {
          const d = Math.abs(num - playhead.current)
          if (d > worstD) {
            worstD = d
            worstN = num
          }
        })
        if (worstN >= 0 && worstN !== n) {
          const gone = frames.current.get(worstN)
          if (gone && typeof (gone as ImageBitmap).close === 'function') {
            ;(gone as ImageBitmap).close()
          }
          frames.current.delete(worstN)
          const li = loadedNumbers.current.indexOf(worstN)
          if (li >= 0) loadedNumbers.current.splice(li, 1)
          pending.current.push(worstN)
          pump()
        }
      }

      // publish twice per pass instead of on every frame: React re-renders of
      // the HUD were competing with the scroll loop for frame time.
      const ratio = decoded / numbers.length
      const nextMark = publishes === 0 ? 0.02 : 1
      if (ratio >= (publishes === 0 ? 0.02 : 0.999) || ratio >= nextMark) {
        if (publishes < 2) publishes += 1
      }
      notify()
    }

    // ── concurrency gate ──────────────────────────────────────────────────
    let active = 0
    const pump = () => {
      if (cancelled) return
      while (active < Math.max(1, concurrency) && pending.current.length) {
        // prioritise whatever sits closest to the playhead right now
        const head = playhead.current
        let bestIdx = 0
        let bestDist = Infinity
        for (let i = 0; i < pending.current.length; i++) {
          const d = Math.abs(pending.current[i] - head)
          if (d < bestDist) {
            bestDist = d
            bestIdx = i
            if (d === 0) break
          }
        }
        const n = pending.current.splice(bestIdx, 1)[0]
        active += 1
        fetchOne(n).then(() => {
          active -= 1
          if (!cancelled) {
            if (decoded >= coarseTotal) setCoarseDone(true)
            if (pending.current.length === 0) setComplete(true)
            pump()
          }
        })
      }
    }

    pump()

    return () => {
      cancelled = true
      queued.current.clear()
      frames.current.forEach((f) => {
        if (typeof (f as ImageBitmap).close === 'function') (f as ImageBitmap).close()
      })
      frames.current.clear()
      loadedNumbers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numbers, url, concurrency, coarseStep])

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
        playhead.current = n
        return nearest(n)
      },
      frameNumberAt,
      loaded: complete ? 1 : coarseDone ? 0.35 : 0,
      ready: coarseDone,
      onDecode,
    }
  }, [count, startAt, stride, coarseDone, complete, onDecode])
}
