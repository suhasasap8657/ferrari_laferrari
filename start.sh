#!/usr/bin/env bash
# One-shot boot script: installs deps if the sandbox reset wiped them,
# then serves on 0.0.0.0:5173 (the port the preview tunnel expects).
set -e
cd "$(dirname "$0")"
[ -x node_modules/.bin/vite ] || npm install --no-audit --no-fund
exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
