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
    // No unique key on reference_no, so main() only calls this when the
    // table is empty — otherwise re-running seed would duplicate directives.
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

const QC_TEMPLATES = [
  {
    name: "Borescope Inspection QA",
    category: "inspection",
    items: [
      { id: "tooling", label: "Borescope calibrated and serial recorded", requiresPhoto: false },
      { id: "access", label: "Inspection ports opened per AMM, blanks fitted", requiresPhoto: false },
      { id: "blades", label: "Compressor and turbine blades imaged", requiresPhoto: true },
      { id: "findings", label: "All findings logged with ATA reference", requiresPhoto: false },
      { id: "closeout", label: "Ports closed, torque-checked and lockwired", requiresPhoto: true },
    ],
  },
  {
    name: "Incoming Parts Receiving Inspection",
    category: "parts",
    items: [
      { id: "cert", label: "Authorized release certificate (EASA Form 1 / FAA 8130-3) present", requiresPhoto: true },
      { id: "pn-sn", label: "Part and serial numbers match paperwork", requiresPhoto: false },
      { id: "shelf", label: "Shelf life / cure date within limits", requiresPhoto: false },
      { id: "damage", label: "No shipping damage or contamination", requiresPhoto: true },
      { id: "esd", label: "ESD / preservation packaging intact where required", requiresPhoto: false },
    ],
  },
  {
    name: "Lease Return Records Audit",
    category: "delivery",
    items: [
      { id: "logbooks", label: "Aircraft and engine logbooks complete and continuous", requiresPhoto: false },
      { id: "ad-status", label: "AD compliance status report reconciled", requiresPhoto: false },
      { id: "llp", label: "LLP back-to-birth traceability verified", requiresPhoto: false },
      { id: "cofa", label: "Certificate of Airworthiness and registration current", requiresPhoto: true },
      { id: "condition", label: "Return-condition inspection signed off", requiresPhoto: false },
    ],
  },
];

async function seedQcTemplates(sql: ReturnType<typeof createDbConnection>) {
  for (const template of QC_TEMPLATES) {
    await sql`
      insert into qc_checklist_templates (name, category, items)
      values (${template.name}, ${template.category}, ${sql.json(template.items)})
      on conflict (name) do update set category = excluded.category, items = excluded.items
    `;
  }
  console.log(`qc_checklist_templates: seeded ${QC_TEMPLATES.length} templates`);
}

// Same components, part numbers, serials and primary life-used profile as the
// old mock module (client/src/data/mock/life-tracking.ts), now with real
// multi-limit components. Every fourth component gets a secondary limit that
// is more consumed than its primary one, so the binding-constraint logic has
// cases where the binding limit isn't the "obvious" one.
const LIFE_USED = [92, 56, 96, 72, 102, 34, 61, 88, 99, 48, 67, 27];
const DAYS_PER_MONTH = 30.4375;

type SeedLimit = { type: "hours" | "cycles" | "calendar_months"; limit: number; pct: number };

function lifeSeedFor(index: number) {
  const pct = (unitIndex: number) => LIFE_USED[(index + unitIndex * 3) % LIFE_USED.length];
  const hoursPct = pct(0);
  const cyclesPct = pct(1);
  const calendarPct = pct(2);
  return [
    {
      description: ["Engine", "APU", "Hydraulic Pump", "Avionics"][index % 4],
      ata: ["72-00-00", "49-00-00", "29-11-00", "34-00-00"][index % 4],
      limits: [
        { type: "hours", limit: 5000, pct: hoursPct },
        { type: "cycles", limit: 12000, pct: Math.round(hoursPct * 0.7) },
        { type: "calendar_months", limit: 60, pct: index % 4 === 1 ? Math.min(hoursPct + 15, 104) : Math.round(hoursPct * 0.5) },
      ] as SeedLimit[],
    },
    {
      description: ["Landing Gear", "Wheel Assembly", "Brake System"][index % 3],
      ata: ["32-10-00", "32-41-00", "32-42-00"][index % 3],
      limits: [
        { type: "cycles", limit: 12000, pct: cyclesPct },
        { type: "calendar_months", limit: 120, pct: index % 4 === 2 ? Math.min(cyclesPct + 12, 104) : Math.round(cyclesPct * 0.6) },
      ] as SeedLimit[],
    },
    {
      description: ["Emergency Battery", "Oxygen Cylinder", "Fire Extinguisher"][index % 3],
      ata: ["24-31-00", "35-20-00", "26-20-00"][index % 3],
      limits: [{ type: "calendar_months", limit: 24, pct: calendarPct }] as SeedLimit[],
    },
  ];
}

async function seedLifeTracking(sql: ReturnType<typeof createDbConnection>) {
  const now = Date.now();
  let componentCount = 0;
  let limitCount = 0;
  for (let index = 0; index < aircraft.length; index++) {
    const plane = aircraft[index];
    const components = lifeSeedFor(index);
    for (let unitIndex = 0; unitIndex < components.length; unitIndex++) {
      const spec = components[unitIndex];
      const calendar = spec.limits.find(limit => limit.type === "calendar_months")!;
      const installDate = new Date(now - (calendar.pct / 100) * calendar.limit * DAYS_PER_MONTH * 86_400_000).toISOString().slice(0, 10);
      const [component] = await sql`
        insert into components (aircraft_tail, part_number, serial_number, description, ata_chapter, install_date)
        values (
          ${plane.tail},
          ${`${["ENG", "LG", "CAL"][unitIndex]}-${12000 + index * 137}-${unitIndex + 1}`},
          ${`WB${26000 + index * 31 + unitIndex}`},
          ${spec.description}, ${spec.ata}, ${installDate}
        )
        on conflict (part_number, serial_number) do nothing
        returning id
      `;
      if (!component) continue;
      componentCount++;
      for (const limit of spec.limits) {
        const current = limit.type === "calendar_months" ? 0 : Math.round((limit.pct / 100) * limit.limit);
        await sql`
          insert into component_life_limits (component_id, limit_type, limit_value, current_value)
          values (${component.id}, ${limit.type}, ${limit.limit}, ${current})
          on conflict (component_id, limit_type) do nothing
        `;
        limitCount++;
      }
    }
  }
  console.log(`components: seeded ${componentCount} components, ${limitCount} life limits`);
}

async function main() {
  const sql = createDbConnection();
  try {
    await seedAircraft(sql);
    const [{ count }] = await sql`select count(*)::int as count from directives`;
    if (count === 0) await seedDirectives(sql);
    else console.log(`directives: ${count} already present, skipped`);
    await seedQcTemplates(sql);
    await seedLifeTracking(sql);
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
