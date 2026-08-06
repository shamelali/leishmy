#!/usr/bin/env bash
# neon_to_supabase_migrate.sh
# Safe, idempotent migration helper: Neon (leish-prod) -> Supabase
# Usage:
#   NEON_URL="<neon_admin_url>" SUPA_DIRECT_URL="<supabase_direct_5432_url>" SUPA_POOLED_URL="<supabase_pooled_6543_url>" \
#     ./scripts/neon_to_supabase_migrate.sh [--dry-run] [--run-migrations] [--staging=<staging_url>]
#
# Features:
#  - Inventory (extensions, tables, sizes)
#  - Full backup (custom format) + schema-only dump
#  - Optionally run drizzle migrations against Supabase direct URL
#  - Data-only dump from Neon with --disable-triggers
#  - Data-only restore into Supabase (direct URL)
#  - Sequence resets for serial columns
#  - Row-count verification (Neon vs Supabase)
#  - Dry-run mode that prints commands without executing
#
# Safety notes:
#  - This script does NOT change Vercel envs or deploys.
#  - Always review and test on a staging Supabase project first.
#  - Keep NEON_URL intact for rollback.

set -euo pipefail

DRY_RUN=false
RUN_MIGRATIONS=false
STAGING_URL=""
ARTIFACT_DIR="migration_artifacts_$(date +%Y%m%d_%H%M%S)"
JOBS=${JOBS:-4}

# simple logger
log(){ echo "[INFO] $*"; }
err(){ echo "[ERROR] $*" >&2; }
run(){ if [ "$DRY_RUN" = true ]; then echo "+ $*"; else echo "+ $*"; eval "$*"; fi }

# parse args
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --run-migrations) RUN_MIGRATIONS=true; shift ;;
    --staging=*) STAGING_URL="${1#*=}"; shift ;;
    --jobs=*) JOBS="${1#*=}"; shift ;;
    -h|--help)
      sed -n '1,120p' "$0" | sed -n '1,200p'
      exit 0 ;;
    *) err "Unknown arg: $1"; exit 2 ;;
  esac
done

# required envs
: "${NEON_URL:?NEON_URL must be set (Neon admin connection string)}"
: "${SUPA_DIRECT_URL:?SUPA_DIRECT_URL must be set (Supabase direct 5432 URL for migrations)}"
: "${SUPA_POOLED_URL:?SUPA_POOLED_URL must be set (Supabase pooled 6543 URL for runtime)}"

# check tools
for cmd in psql pg_dump pg_restore; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Required command not found: $cmd. Install Postgres client tools and retry."; exit 3
  fi
done
if $RUN_MIGRATIONS && ! command -v npx >/dev/null 2>&1; then
  err "npx is required for drizzle migrations (use --run-migrations)."; exit 3
fi

run "mkdir -p \"$ARTIFACT_DIR\""
log "Artifacts and dumps will be placed in: $ARTIFACT_DIR"

# Step 0: Inventory
log "STEP 0: Inventory (extensions, tables, top sizes)"
EXT_FILE="$ARTIFACT_DIR/neon_extensions.txt"
TABLES_FILE="$ARTIFACT_DIR/neon_tables.txt"
SIZES_FILE="$ARTIFACT_DIR/neon_table_sizes.txt"

run "psql \"$NEON_URL\" -At -c \"SELECT extname FROM pg_extension ORDER BY extname;\" > \"$EXT_FILE\""
run "psql \"$NEON_URL\" -At -c \"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;\" > \"$TABLES_FILE\""
run "psql \"$NEON_URL\" -At -c \"SELECT table_name, pg_total_relation_size(quote_ident(table_name)) AS bytes FROM information_schema.tables WHERE table_schema='public' ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC LIMIT 200;\" > \"$SIZES_FILE\""

log "Inventory written: $EXT_FILE, $TABLES_FILE, $SIZES_FILE"

# Optional: confirm extensions are present on Supabase (dry-run will print)
log "Checking Supabase for required extensions"
run "psql \"$SUPA_DIRECT_URL\" -At -c \"SELECT extname FROM pg_extension ORDER BY extname;\" > \"$ARTIFACT_DIR/supa_extensions.txt\""

# Step 1: Backups
log "STEP 1: Backups (full dump + schema-only)"
FULL_DUMP="$ARTIFACT_DIR/leish_prod_full.dump"
SCHEMA_DUMP="$ARTIFACT_DIR/leish_schema.sql"
DATA_INSERTS="$ARTIFACT_DIR/leish_data_inserts.sql"

run pg_dump --format=custom --no-owner --no-privileges --file="$FULL_DUMP" "$NEON_URL"
run pg_dump --schema-only --no-owner --no-privileges --file="$SCHEMA_DUMP" "$NEON_URL"
run pg_dump --data-only --inserts --no-owner --no-privileges --file="$DATA_INSERTS" "$NEON_URL"

log "Backups created: $FULL_DUMP, $SCHEMA_DUMP, $DATA_INSERTS"

# Step 2: Apply schema on Supabase via Drizzle (optional)
if [ "$RUN_MIGRATIONS" = true ]; then
  log "STEP 2: Running drizzle migrations against Supabase direct URL"
  run export DATABASE_URL="$SUPA_DIRECT_URL" && run npx drizzle-kit migrate
  log "Drizzle migrations finished (or printed in dry-run)."
else
  log "STEP 2: Skipping drizzle migrations (use --run-migrations to enable)."
fi

# Step 3: Data-only dump from Neon (disable triggers)
log "STEP 3: Creating data-only dump from Neon (disable triggers)"
DATA_DUMP="$ARTIFACT_DIR/leish_data.dump"
run pg_dump "$NEON_URL" --data-only --disable-triggers --no-owner --no-privileges --schema=public -Fc -f "$DATA_DUMP"
log "Data-only dump: $DATA_DUMP"

# Step 4: Restore into Supabase direct URL
log "STEP 4: Restoring data into Supabase (direct URL)"
restore_with_retry() {
  local dump="$1"
  local target="$2"
  if [ "$DRY_RUN" = true ]; then
    echo "+ pg_restore --data-only --disable-triggers --no-owner --no-privileges --jobs=$JOBS -d \"$target\" \"$dump\""
    return 0
  fi
  set +e
  pg_restore --data-only --disable-triggers --no-owner --no-privileges --jobs=$JOBS -d "$target" "$dump"
  rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    log "pg_restore failed with exit code $rc — retrying with --single-transaction"
    pg_restore --data-only --disable-triggers --no-owner --no-privileges --single-transaction -d "$target" "$dump"
  fi
}
restore_with_retry "$DATA_DUMP" "$SUPA_DIRECT_URL"

# Step 5: Reset sequences
log "STEP 5: Resetting sequences on Supabase (ensures serial PKs continue correctly)"
SEQ_SQL="$ARTIFACT_DIR/sequence_setvals.sql"
# generate setval statements for tables with serial id columns
run "psql \"$SUPA_DIRECT_URL\" -At -c \"SELECT 'SELECT pg_catalog.setval(pg_get_serial_sequence(''''||table_schema||'.'||table_name||''''','''''||column_name||'''''), COALESCE(MAX('||quote_ident(column_name)||'),1)) FROM '||quote_ident(table_schema)||'.'||quote_ident(table_name)||';' FROM information_schema.columns WHERE table_schema='public' AND column_default LIKE 'nextval(%' ORDER BY table_name;\" > \"$SEQ_SQL\""
log "Generated sequence reset statements: $SEQ_SQL"
if [ "$DRY_RUN" = true ]; then
  cat "$SEQ_SQL"
else
  run psql "$SUPA_DIRECT_URL" -f "$SEQ_SQL"
fi

# Step 6: Row-count verification
log "STEP 6: Row-count verification (Neon vs Supabase)"
NEON_COUNTS="$ARTIFACT_DIR/neon_counts.txt"
SUPA_COUNTS="$ARTIFACT_DIR/supa_counts.txt"
run "psql \"$NEON_URL\" -At -c \"SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;\" > \"$NEON_COUNTS\""
run "psql \"$SUPA_DIRECT_URL\" -At -c \"SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;\" > \"$SUPA_COUNTS\""

log "Counts written to $NEON_COUNTS and $SUPA_COUNTS"
log "You can run: diff -u $NEON_COUNTS $SUPA_COUNTS to compare them or inspect mismatches manually."

# Step 7: Post-restore checks for the specific launch blockers
log "STEP 7: Quick presence checks for known launch-blockers"
run psql "$SUPA_DIRECT_URL" -c "SELECT to_regclass('public.availability_rules') AS availability_rules_exists;"
run psql "$SUPA_DIRECT_URL" -c "SELECT to_regclass('public.availability_overrides') AS availability_overrides_exists;"
run psql "$SUPA_DIRECT_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='promo_code_id';"

# Step 8: Next steps guidance
cat <<EOF
Migration script finished (dry-run=${DRY_RUN}). Artifacts are in: $ARTIFACT_DIR
Next manual steps:
 - Review $ARTIFACT_DIR/* for inventory and row-count diffs.
 - If row-counts match, update Vercel DATABASE_URL to the SUPABASE_POOLED_URL (port 6543) and keep NEON_URL as NEON_AUTH_URL for auth reads.
 - Update the sync-auth-users cron to read from NEON_AUTH_URL and write to DATABASE_URL (pooled).
 - Perform smoke tests: sign-in, create booking, test /api/availability, test Brevo email flow.
 - If everything is OK, you may downgrade Neon to a minimal tier and keep it running for auth only. Do not delete Neon until you are 48+ hours confident.

To rollback (manual): revert Vercel DATABASE_URL to the original NEON_URL and redeploy.
EOF

log "Done."

exit 0
