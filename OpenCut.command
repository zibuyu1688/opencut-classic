#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v bun >/dev/null 2>&1; then
	echo "Bun is required to start OpenCut. Please install Bun first: https://bun.sh/docs/installation"
	exit 1
fi

echo "Starting OpenCut..."
nohup bun run dev:web >/tmp/opencut-web.log 2>&1 &
open "http://localhost:3000"