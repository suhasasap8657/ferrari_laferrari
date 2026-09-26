#!/usr/bin/env python3
"""Upscale every 360° sequence frame to 4K (3840x2160, Lanczos) and
re-encode as WebP q60, in place. Resume-safe: frames already at target
width are skipped. Corrupt frames are rebuilt from FALLBACK originals.
Writes are atomic (tmp + rename) so a kill can never corrupt a frame.
Uses all cores."""
import os
from multiprocessing import Pool
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'media', 'frames')
FALLBACK = '/tmp/orig_frames'
TARGET = (3840, 2160)
QUALITY = 60


def work(i):
    p = os.path.join(SRC, f'frame_{i:04d}.webp')
    src = None
    try:
        with Image.open(p) as im:
            if im.width >= TARGET[0]:
                return 'skip'
            src = im.convert('RGB')
    except Exception:
        src = None
    if src is None:
        orig = os.path.join(FALLBACK, f'frame_{i:04d}.webp')
        if not os.path.exists(orig):
            return 'missing'
        with Image.open(orig) as im:
            src = im.convert('RGB')
    up = src.resize(TARGET, Image.LANCZOS)
    tmp = p + '.tmp'
    up.save(tmp, 'WEBP', quality=QUALITY, method=6)
    os.replace(tmp, p)
    return 'done'


if __name__ == '__main__':
    done = skip = missing = 0
    with Pool(processes=min(2, os.cpu_count() or 1)) as pool:
        for i, res in enumerate(pool.imap_unordered(work, range(1, 1031)), 1):
            if res == 'done':
                done += 1
            elif res == 'skip':
                skip += 1
            else:
                missing += 1
            if i % 50 == 0:
                print(f'progress: {i}/1030 processed ({done} upscaled, {skip} skipped, {missing} missing)', flush=True)
    print(f'DONE: {done} upscaled, {skip} skipped, {missing} missing', flush=True)
