// Foundations acceptance criterion, verified literally: "Changing a
// settings threshold changes Life Tracking statuses and is written to the
// audit log." Runs against the real apiApp and real demo database, same
// convention as clientScope.integration.test.ts.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { apiApp } from "../apiApp.js";
import { supabase } from "../lib/supabase.js";
import { SETTINGS_KEYS } from "../lib/settings.js";

const password = process.env.SEED_USER_PASSWORD;
if (!password) throw new Error("Set SEED_USER_PASSWORD in .env before running tests.");

async function loginAgent(email: string) {
  const agent = request.agent(apiApp);
  const res = await agent.post("/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

describe("settings -> life tracking", () => {
  let admin: ReturnType<typeof request.agent>;
  let originalDueSoonPct: number;

  beforeAll(async () => {
    admin = await loginAgent("admin@wingbox.aero");
    const { data } = await supabase.from("settings").select("value").eq("key", SETTINGS_KEYS.dueSoonUsedPct).single();
    originalDueSoonPct = data!.value as number;
  });

  afterAll(async () => {
    // Restore, so this test never leaves the demo database's real
    // threshold changed for other tests or a human poking at the app after.
    await admin.patch(`/settings/${encodeURIComponent(SETTINGS_KEYS.dueSoonUsedPct)}`).send({ value: originalDueSoonPct });
  });

  it("a non-Admin role cannot change a setting", async () => {
    const engineer = await loginAgent("engineer@wingbox.aero");
    await engineer.patch(`/settings/${encodeURIComponent(SETTINGS_KEYS.dueSoonUsedPct)}`).send({ value: 50 }).expect(403);
  });

  it("lowering the Due Soon threshold flips at least one component's status and is audited", async () => {
    // Set the threshold absurdly low (1%) so anything with any usage at all
    // becomes "Due Soon" — deterministic regardless of the demo data's
    // exact current values.
    const patchRes = await admin.patch(`/settings/${encodeURIComponent(SETTINGS_KEYS.dueSoonUsedPct)}`).send({ value: 1 }).expect(200);
    expect(patchRes.body.value).toBe(1);

    const after = await admin.get("/life-tracking/components").expect(200);
    const anyDueSoonNow = after.body.some((c: { limits: { usedPct: number; status: string }[] }) =>
      c.limits.some(l => l.usedPct >= 1 && l.usedPct < 100 && l.status === "Due Soon"),
    );
    expect(anyDueSoonNow).toBe(true);

    const { data: auditRows } = await supabase
      .from("audit_events")
      .select("*")
      .eq("action", "settings.update")
      .eq("entity_id", SETTINGS_KEYS.dueSoonUsedPct)
      .order("timestamp", { ascending: false })
      .limit(1);
    expect(auditRows?.[0]).toBeTruthy();
    expect((auditRows![0].after_state as { value: number }).value).toBe(1);
  });
});
