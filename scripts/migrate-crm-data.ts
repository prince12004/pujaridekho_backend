/**
 * One-off migration: copies SalesPerson, Inquiry and ActivityLog documents
 * from the standalone CRM backend's MongoDB (pujaridekhocrm/backend,
 * database `pd_crm`, read from THAT project's own .env — never hardcoded
 * here) into this API's database (apps/api/.env's MONGODB_URI), using the
 * new SalesPersonModel / CrmInquiryModel / CrmActivityLogModel collections.
 *
 * Does NOT touch the source database — read-only there. Idempotent: upserts
 * by the app-level `id` field (NOT by Mongo `_id` — see note below), so
 * it's safe to re-run after partial failures or to pick up newly-created
 * CRM records before a final cutover run.
 *
 * Usage:
 *   pnpm migrate:crm -- --dry-run     # report counts only, writes nothing
 *   pnpm migrate:crm                  # actually copy
 *
 * IMPORTANT — do not run this for real without first:
 *   1. Confirming apps/api's MONGODB_URI points at the intended destination
 *      (the production website database) — this script prints which host/db
 *      it resolved on both sides before writing anything, so check that
 *      output at a glance before answering yes to anything downstream.
 *   2. Taking a fresh mongodump backup of BOTH databases.
 *   3. Running once with --dry-run and reviewing the counts.
 *   4. Confirming no other process is writing to pd_crm during the run
 *      (brief write pause on the old CRM, or run during low traffic).
 *
 * _id strategy: Mongo ObjectIds from `pd_crm` are NOT reused here — each
 * collection already carries its own app-level unique string `id` (or
 * `phone` for SalesPerson), which every route in this codebase queries by,
 * never by Mongo _id. Reusing the old _ids would only matter if some other
 * part of this codebase referenced CrmInquiry/SalesPerson by Mongo _id, and
 * none does. Letting Mongo assign fresh _ids here removes any chance of an
 * ObjectId collision with documents already created by this API's own
 * features (e.g. a CrmInquiry created via POST /crm-inquiries before this
 * script runs) — upserts are matched on the natural key instead.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import mongoose from "mongoose";
import { SalesPersonModel } from "../src/models/sales-person.model.js";
import { CrmInquiryModel } from "../src/models/crm-inquiry.model.js";
import { CrmActivityLogModel } from "../src/models/crm-activity-log.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes("--dry-run");

// Load the OLD CRM's own .env for its MONGODB_URI, without touching
// process.env.MONGODB_URI that apps/api's own dotenv load (src/config/env.ts
// imports this script's entry indirectly via the models, which import
// mongoose but not env.ts) might otherwise set. We read both .env files by
// hand into separate variables rather than relying on dotenv's single
// process-wide `.env` convention, since both exist in this repo with the
// same variable name.
function readEnvFile(envPath: string): Record<string, string> {
  const result = config({ path: envPath, processEnv: {} as NodeJS.ProcessEnv });
  return (result.parsed ?? {}) as Record<string, string>;
}

const oldEnvPath = path.resolve(__dirname, "../../../pujaridekhocrm/backend/.env");
const newEnvPath = path.resolve(__dirname, "../.env");

const oldEnv = readEnvFile(oldEnvPath);
const newEnv = readEnvFile(newEnvPath);

const OLD_MONGODB_URI = oldEnv.MONGODB_URI;
const NEW_MONGODB_URI = newEnv.MONGODB_URI;

if (!OLD_MONGODB_URI) {
  throw new Error(`MONGODB_URI not found in ${oldEnvPath} (old CRM's pd_crm database)`);
}
if (!NEW_MONGODB_URI) {
  throw new Error(`MONGODB_URI not found in ${newEnvPath} (this API's database)`);
}

// Never print full credentials — only host + db name, which is what you
// actually need to eyeball to confirm "old = pd_crm, new = the website's
// real database", without risking a password ending up in a terminal
// scrollback or CI log.
function describeUri(uri: string): string {
  try {
    const u = new URL(uri.replace(/^mongodb\+srv:/, "https:").replace(/^mongodb:/, "https:"));
    return `${u.hostname}${u.pathname}`;
  } catch {
    return "(unparseable URI)";
  }
}

async function main() {
  console.log(`Mode: ${isDryRun ? "DRY RUN (no writes)" : "LIVE — will write to destination"}`);
  console.log(`Source (old CRM):      ${describeUri(OLD_MONGODB_URI)}`);
  console.log(`Destination (website): ${describeUri(NEW_MONGODB_URI)}`);

  const sourceConn = await mongoose.createConnection(OLD_MONGODB_URI).asPromise();
  const destConn = isDryRun ? null : await mongoose.createConnection(NEW_MONGODB_URI).asPromise();

  try {
    // Source: read with plain, schema-less collections — we don't want the
    // destination's validators/enums silently dropping a field the old
    // database happens to have that the new schema doesn't expect (that
    // should be a visible warning, not a silent loss).
    const sourceSalesPeople = sourceConn.collection("salespeople");
    const sourceInquiries = sourceConn.collection("inquiries");
    const sourceActivityLogs = sourceConn.collection("activitylogs");

    const [spCount, inqCount, logCount] = await Promise.all([
      sourceSalesPeople.countDocuments(),
      sourceInquiries.countDocuments(),
      sourceActivityLogs.countDocuments(),
    ]);
    console.log(`\nSource counts: salespeople=${spCount} inquiries=${inqCount} activityLogs=${logCount}`);

    if (isDryRun) {
      console.log("\n--dry-run: no writes performed. Re-run without --dry-run to migrate.");
      return;
    }

    const destSalesPersonModel = destConn!.model(SalesPersonModel.modelName, SalesPersonModel.schema);
    const destCrmInquiryModel = destConn!.model(CrmInquiryModel.modelName, CrmInquiryModel.schema);
    const destCrmActivityLogModel = destConn!.model(CrmActivityLogModel.modelName, CrmActivityLogModel.schema);

    let spMigrated = 0;
    for await (const doc of sourceSalesPeople.find()) {
      const { _id, ...fields } = doc;
      await destSalesPersonModel.updateOne(
        { id: fields.id },
        { $set: fields },
        { upsert: true },
      );
      spMigrated++;
    }
    console.log(`SalesPerson: upserted ${spMigrated}/${spCount}`);

    let inqMigrated = 0;
    for await (const doc of sourceInquiries.find()) {
      const { _id, ...fields } = doc;
      await destCrmInquiryModel.updateOne(
        { id: fields.id },
        { $set: fields },
        { upsert: true },
      );
      inqMigrated++;
    }
    console.log(`CrmInquiry: upserted ${inqMigrated}/${inqCount}`);

    let logMigrated = 0;
    for await (const doc of sourceActivityLogs.find()) {
      const { _id, ...fields } = doc;
      await destCrmActivityLogModel.updateOne(
        { id: fields.id },
        { $set: fields },
        { upsert: true },
      );
      logMigrated++;
    }
    console.log(`CrmActivityLog: upserted ${logMigrated}/${logCount}`);

    console.log("\nEnsuring indexes on destination collections (safe no-op if already present)...");
    await Promise.all([
      destCrmInquiryModel.createIndexes(),
      destSalesPersonModel.createIndexes(),
      destCrmActivityLogModel.createIndexes(),
    ]);

    console.log("\nDone. Verify counts in the destination database before decommissioning the old CRM backend.");
  } finally {
    await sourceConn.close();
    if (destConn) await destConn.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
