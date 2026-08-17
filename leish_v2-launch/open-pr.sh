#!/usr/bin/env bash
# One-shot: open the leish_v2 launch-hardening PR.
# Works either from this session (when the GitHub app has write access to
# shamelali/leish_v2) or on your own machine with your GitHub login.
#
# Usage:  bash open-pr.sh
set -euo pipefail

BUNDLE="$(cd "$(dirname "$0")" && pwd)/patches/leish_v2-launch-hardening.bundle"
PR_BODY="$(cd "$(dirname "$0")" && pwd)/PR_BODY.md"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo ">> cloning shamelali/leish_v2..."
git clone --quiet https://github.com/shamelali/leish_v2.git "$WORKDIR/leish_v2"
cd "$WORKDIR/leish_v2"

echo ">> restoring launch-hardening branch from bundle..."
git fetch --quiet "$BUNDLE" launch-hardening
git branch launch-hardening FETCH_HEAD
git checkout -q launch-hardening

echo ">> pushing launch-hardening..."
git push origin launch-hardening

echo ">> opening the PR..."
gh pr create \
  --base main \
  --head launch-hardening \
  --title "Unify public booking loop onto db-facade backend; harden launch gates" \
  --body-file "$PR_BODY"

echo ">> done."
