#!/usr/bin/env bash
# Build and serve the Mímir website on http://localhost:3000 (production mode).
set -euo pipefail
cd "$(dirname "$0")/apps/web"
node_modules/.bin/next build
exec node_modules/.bin/next start -p 3000
