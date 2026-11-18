/**
 * Optional CLI for the Delhi NCR starter set — the same import as Admin →
 * SEO Management → "Import starter data". Never overwrites existing data.
 *
 *   npm run seed:seo                       # apply
 *   npm run seed:seo -- --dry-run          # report only
 *   npm run seed:seo -- --reset-footer     # rebuild the footer blocks
 *   npm run seed:seo -- --publish-drafts-noindex  # also publish draft location pages as noindex
 */
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { importStarterData } from "../src/features/seo-management/starter-data.service.js";

async function main() {
  await connectDatabase();
  const dryRun = process.argv.includes("--dry-run");
  console.log(`Connected to ${mongoose.connection.name}${dryRun ? " (dry run)" : ""}`);
  const report = await importStarterData({
    dryRun,
    resetFooter: process.argv.includes("--reset-footer"),
    publishDraftsNoindex: process.argv.includes("--publish-drafts-noindex"),
  });
  console.log(JSON.stringify(report, null, 2));
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
