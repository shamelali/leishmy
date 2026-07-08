import "dotenv/config";
import { runSweep } from "../src/lib/cloudinary-sweep";

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = args.includes("--dry-run") || !isApply;

  if (isDryRun && !isApply) {
    console.log("[sweep] DRY RUN — no assets will be deleted.");
    console.log("[sweep] Pass --apply to perform the actual delete.\n");
  } else {
    console.log("[sweep] APPLY MODE — assets WILL be deleted.\n");
  }

  const summary = await runSweep({ dryRun: isDryRun });

  console.log("[sweep] Complete:");
  console.log(`  scanned:    ${summary.scanned}`);
  console.log(`  deleted:    ${summary.deleted}`);
  console.log(`  errors:     ${summary.errors}`);
  console.log(`  durationMs: ${summary.durationMs}`);
  console.log(`  details:    ${JSON.stringify(summary.details)}`);

  if (isDryRun && !isApply) {
    console.log("\n[sweep] Re-run with --apply to commit.");
  }
}

main().catch((err) => {
  console.error("[sweep] Fatal:", err);
  process.exit(1);
});
