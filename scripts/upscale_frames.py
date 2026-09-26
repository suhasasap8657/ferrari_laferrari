#!/usr/bin/env python3
"""Upscale every 360° sequence frame from 1280x720 to 1920x1080 (Lanczos)
and re-encode as high-quality WebP, in place. Resume-safe: frames already
at target width are skipped."""
import os
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'media', 'frames')
TARGET = (1920, 1080)
QUALITY = 80

done = skipped = 0
for i in range(1, 1031):
    p = os.path.join(SRC, f'frame_{i:04d}.webp')
    if not os.path.exists(p):
        continue
    with Image.open(p) as im:
        if im.width >= TARGET[0]:
            skipped += 1
            continue
        up = im.convert('RGB').resize(TARGET, Image.LANCZOS)
    up.save(p, 'WEBP', quality=QUALITY, method=6)
    done += 1
    if done % 100 == 0:
        print(f'progress: {done} upscaled, {skipped} skipped', flush=True)

print(f'DONE: {done} upscaled, {skipped} skipped', flush=True)
