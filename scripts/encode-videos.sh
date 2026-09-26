#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# encode-videos.sh
# Re-encodes a source film into the three web assets this site uses:
#   hero-loop.mp4 / hero-loop.webm  – short muted loop for the hero band
#   film.mp4       / film.webm      – the full film for the film section
# Audio is stripped so autoplay is never blocked by browser policy, and
# +faststart moves the MP4 moov atom to the front so playback can begin
# before the file finishes downloading.
#
# Usage: ./scripts/encode-videos.sh <source.mp4> [loop-start] [loop-end]
# Example: ./scripts/encode-videos.sh videoplayback.mp4 18 50
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SRC="${1:?usage: encode-videos.sh <source.mp4> [loop-start-seconds] [loop-end-seconds]}"
LOOP_START="${2:-18}"
LOOP_END="${3:-50}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media"

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found — brew install ffmpeg / apt install ffmpeg"; exit 1; }
mkdir -p "$OUT"

echo "→ hero loop (${LOOP_START}s → ${LOOP_END}s, 1440×810, no audio)"
ffmpeg -y -hide_banner -loglevel error -ss "$LOOP_START" -to "$LOOP_END" -i "$SRC" \
  -vf scale=1440:810 -c:v libx264 -preset slower -crf 26 -pix_fmt yuv420p -profile:v high \
  -movflags +faststart -an "$OUT/hero-loop.mp4"

ffmpeg -y -hide_banner -loglevel error -ss "$LOOP_START" -to "$LOOP_END" -i "$SRC" \
  -vf scale=1440:810 -c:v libvpx-vp9 -crf 36 -b:v 0 -deadline good -cpu-used 4 -row-mt 1 -an \
  "$OUT/hero-loop.webm"

echo "→ full film (1440×810, no audio)"
ffmpeg -y -hide_banner -loglevel error -i "$SRC" \
  -vf scale=1440:810 -c:v libx264 -preset medium -crf 30 -pix_fmt yuv420p -profile:v high \
  -movflags +faststart -an "$OUT/film.mp4"

# WebM/VP9 fallback: only fetched by browsers that cannot decode H.264, so keep it lean.
ffmpeg -y -hide_banner -loglevel error -i "$SRC" \
  -vf scale=960:540 -c:v libvpx-vp9 -crf 44 -b:v 0 -deadline realtime -cpu-used 8 -row-mt 1 -an \
  "$OUT/film.webm"

echo "✓ done"
ls -lh "$OUT"/*.mp4 "$OUT"/*.webm
