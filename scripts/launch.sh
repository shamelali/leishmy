#!/usr/bin/env bash
# Leish! Production Launch Script (bash wrapper)
# Usage: ./scripts/launch.sh [--check-only] [--dry-run] [--skip-build]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD}Leish! Launch — Bash Wrapper${NC}"
echo -e "${BOLD}============================================================${NC}"
echo "Root: $ROOT"
echo "Args: $*"
echo ""

# Check pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo -e "${RED}pnpm not found — install with npm i -g pnpm${NC}"
  exit 1
fi

# Check tsx
if ! pnpm exec tsx --version >/dev/null 2>&1; then
  echo -e "${YELLOW}tsx not found — installing...${NC}"
  pnpm add -D tsx
fi

# Run the main TS launch script with all args forwarded
echo -e "${GREEN}Running scripts/launch.ts ...${NC}"
exec pnpm exec tsx scripts/launch.ts "$@"
