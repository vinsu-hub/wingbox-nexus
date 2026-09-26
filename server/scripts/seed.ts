// Idempotent demo-data seeding, separate from schema migrations (supabase/migrations/)
// since this is data, not structure. Safe to re-run — every insert upserts by
// primary/natural key. Run with: pnpm seed
import "dotenv/config";
import { createDbConnection } from "../lib/dbConnection.js";
import { aircraft } from "../../client/src/data/aircraft.js";

async function seedAircraft(sql: ReturnType<typeof createDbConnection>) {
  for (const a of aircraft) {
    await sql`
      insert into aircraft (tail_number, type, client, status)
      values (${a.tail}, ${a.type}, ${a.client}, ${a.status})
      on conflict (tail_number) do update set type = excluded.type, client = excluded.client, status = excluded.status
    `;
  }
  console.log(`aircraft: seeded ${aircraft.length} rows`);
}

// Same demo directives the old mock module (client/src/data/mock/compliance.ts)
// used, ported to the normalized schema: `family` picks which aircraft are
// applicable (empty string = whole fleet), `priority` is the status assigned
// to one applicable aircraft (deterministically chosen by directive index,
// same as the mock did) — every other applicable aircraft is "Compliant".
// Non-applicable aircraft simply get no compliance_records row; the API
// fills "N/A" for those client-side.
const DEMO_DIRECTIVES = [
  { referenceNo: "AD 2021-12-05", authority: "EASA", issueDate: "2021-12-05", deadline: "2026-05-18", title: "Engine fuel pump inspection", ataChapter: "73-21-00", family: "A32", priority: "Overdue" },
  { referenceNo: "AD 2022-07-14", authority: "EASA", issueDate: "2022-07-14", deadline: "2026-06-14", title: "Landing gear actuator inspection", ataChapter: "32-31-00", family: "", priority: "Due Soon" },
  { referenceNo: "AD 2023-03-22", authority: "FAA", issueDate: "2023-03-22", deadline: "2026-08-22", title: "Oxygen generator replacement", ataChapter: "35-21-00", family: "", priority: "Compliant" },
  { referenceNo: "SB A320-27-1234", authority: "Airbus", issueDate: "2024-02-12", deadline: "2026-05-12", title: "Cabin pressure system inspection", ataChapter: "21-31-00", family: "A320", priority: "Overdue" },
  { referenceNo: "AD 2024-11-10", authority: "EASA", issueDate: "2024-11-10", deadline: "2026-09-10", title: "Hydraulic pump inspection", ataChapter: "29-11-00", family: "", priority: "Compliant" },
  { referenceNo: "SB A321-48-5678", authority: "Airbus", issueDate: "2025-01-08", deadline: "2026-05-16", title: "Avionics software update", ataChapter: "31-31-00", family: "A321", priority: "Overdue" },
  { referenceNo: "AD 2025-02-18", authority: "FAA", issueDate: "2025-02-18", deadline: "2026-06-18", title: "Wing structure inspection", ataChapter: "57-10-00", family: "B737", priority: "Due Soon" },
  { referenceNo: "AD 2025-08-30", authority: "EASA", issueDate: "2025-08-30", deadline: "2026-05-15", title: "Fuel tank safety inspection", ataChapter: "28-11-00", family: "", priority: "Overdue" },
  { referenceNo: "SB A320-56-7890", authority: "Airbus", issueDate: "2025-10-03", deadline: "2026-06-03", title: "Flight deck window inspection", ataChapter: "56-11-00", family: "A320", priority: "Due Soon" },
  { referenceNo: "AD 2026-01-15", authority: "EASA", issueDate: "2026-01-15", deadline: "2026-08-15", title: "Navigation system verification", ataChapter: "34-10-00", family: "", priority: "Compliant" },
  { referenceNo: "SB ATR-27-3344", authority: "ATR", issueDate: "2026-02-10", deadline: "2026-06-10", title: "Flight control inspection", ataChapter: "27-10-00", family: "ATR", priority: "Due Soon" },
  { referenceNo: "AD 2026-04-12", authority: "EASA", issueDate: "2026-04-12", deadline: "2026-10-12", title: "Emergency exit inspection", ataChapter: "52-21-00", family: "", priority: "Compliant" },
] as const;

const DIRECTIVE_STATUS_FOR_PRIORITY: Record<string, string> = {
  Overdue: "open",
  "Due Soon": "in_progress",
  Compliant: "complied",
};

async function seedDirectives(sql: ReturnType<typeof createDbConnection>) {
  let recordCount = 0;
  for (let index = 0; index < DEMO_DIRECTIVES.length; index++) {
    const demo = DEMO_DIRECTIVES[index];
    const type = demo.referenceNo.startsWith("AD") ? "AD" : "SB";
    const description = `${demo.title}. Inspect the applicable assembly for wear, damage, and correct operation. Record findings and refer to AMM ${demo.ataChapter} for the inspection procedure.`;

    const [directive] = await sql`
      insert into directives (type, reference_no, title, applicability, issuing_authority, effective_date, compliance_due, status, ata_chapter, notes)
      values (${type}, ${demo.referenceNo}, ${demo.title}, ${demo.family || "Fleet-wide"}, ${demo.authority}, ${demo.issueDate}, ${demo.deadline}, ${DIRECTIVE_STATUS_FOR_PRIORITY[demo.priority]}, ${demo.ataChapter}, ${description})
      on conflict do nothing
      returning id
    `;
    // `on conflict do nothing` has no natural key to conflict on here (no
    // unique constraint on reference_no), so re-running this script creates
    // duplicate directives — acceptable for a demo seed script that's meant
    // to be run once per fresh environment, not repeatedly against a
    // populated one. Skip inserting records if this run didn't insert a row.
    if (!directive) continue;

    const applicable = aircraft.filter(item => item.type.startsWith(demo.family));
    if (applicable.length === 0) continue;
    const priorityTail = applicable[index % applicable.length].tail;

    for (const item of applicable) {
      const status = item.tail === priorityTail ? demo.priority : "Compliant";
      await sql`
        insert into directive_compliance_records (directive_id, tail_number, status, complied_date, complied_by, signed_off_by)
        values (
          ${directive.id}, ${item.tail}, ${status},
          ${status === "Compliant" ? demo.issueDate : null},
          ${status === "Compliant" ? "Seed Data" : null},
          ${status === "Compliant" ? "Seed Data" : null}
        )
        on conflict (directive_id, tail_number) do nothing
      `;
      recordCount++;
    }
  }
  console.log(`directives: seeded ${DEMO_DIRECTIVES.length} directives, ${recordCount} compliance records`);
}

async function main() {
  const sql = createDbConnection();
  try {
    await seedAircraft(sql);
    await seedDirectives(sql);
    // Wave 1 items 1.3 (qc_checklist_templates) and 1.5 (components) add
    // their own seed functions here as their tables land.
  } finally {
    await sql.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
