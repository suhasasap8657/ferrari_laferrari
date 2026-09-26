#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# optimize-frames.sh
# Converts a folder of source PNG frames into the web-optimised WebP sequence
# used by the scroll canvas. Mirrors exactly how this project's assets were
# produced: 1280px wide, WebP quality 68  →  641 MB of PNG became ~31 MB.
#
# Usage:  ./scripts/optimize-frames.sh <source-frames-dir> [width] [quality]
# Example: ./scripts/optimize-frames.sh ~/frames final 1280 68
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SRC="${1:?usage: optimize-frames.sh <source-frames-dir> [width] [quality]}"
WIDTH="${2:-1280}"
QUALITY="${3:-68}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/media/frames"

command -v cwebp >/dev/null 2>&1 || { echo "cwebp not found — install libwebp (brew install webp / apt install webp)"; exit 1; }

mkdir -p "$OUT"
echo "→ $SRC  →  $OUT   (width ${WIDTH}px, q${QUALITY})"

i=0
for f in "$SRC"/*.png; do
  i=$((i + 1))
  # keep the source numbering: frame_001.png → frame_0001.webp
  n=$(basename "$f" .png | grep -oE '[0-9]+' | tail -1)
  printf -v padded "%04d" "$((10#$n))"
  cwebp -quiet -q "$QUALITY" -resize "$WIDTH" 0 "$f" -o "$OUT/frame_${padded}.webp"
done

echo "✓ converted $i frames"
du -sh "$OUT"
echo
echo "Reminder: keep FRAME_COUNT in src/components/ScrollSequence.tsx in sync."
