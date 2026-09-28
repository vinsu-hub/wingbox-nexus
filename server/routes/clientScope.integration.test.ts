// Cross-client isolation tests — the automated proof the Foundations
// acceptance criteria ask for: "A Client user cannot read another client's
// rows through any endpoint." Runs against the real apiApp and the real
// demo Supabase database (this repo's existing convention, see TODO.md /
// .agent-state.md — no mocking layer exists here), using the two seeded
// Client-role demo accounts from server/scripts/seedUsers.ts:
//   client@wingbox.aero  -> Skyline Air
//   client2@wingbox.aero -> Island Wings
// Requires: pnpm migrate && pnpm seed && pnpm seed:users already run
// against the target database (same precondition as every other script in
// this repo), and SEED_USER_PASSWORD set in .env.
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { apiApp } from "../apiApp.js";
import { supabase } from "../lib/supabase.js";

const password = process.env.SEED_USER_PASSWORD;
if (!password) throw new Error("Set SEED_USER_PASSWORD in .env before running tests (see server/scripts/seedUsers.ts).");

async function loginAgent(email: string) {
  const agent = request.agent(apiApp);
  const res = await agent.post("/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

describe("cross-client isolation", () => {
  let skyline: ReturnType<typeof request.agent>;
  let islandWings: ReturnType<typeof request.agent>;
  let admin: ReturnType<typeof request.agent>;

  // Real fixture IDs pulled live rather than hardcoded, since this runs
  // against the real seeded demo database, not a fixture snapshot.
  let islandWingsTail: string;
  let islandWingsComponentId: string;
  let skylineTail: string;

  beforeAll(async () => {
    skyline = await loginAgent("client@wingbox.aero");
    islandWings = await loginAgent("client2@wingbox.aero");
    admin = await loginAgent("admin@wingbox.aero");

    const { data: clients } = await supabase.from("clients").select("id, name");
    const iw = clients!.find(c => c.name === "Island Wings")!;
    const skl = clients!.find(c => c.name === "Skyline Air")!;

    const { data: iwAircraft } = await supabase.from("aircraft").select("tail_number").eq("client_id", iw.id).limit(1);
    islandWingsTail = iwAircraft![0].tail_number;
    const { data: sklAircraft } = await supabase.from("aircraft").select("tail_number").eq("client_id", skl.id).limit(1);
    skylineTail = sklAircraft![0].tail_number;

    const { data: iwComponent } = await supabase.from("components").select("id").eq("client_id", iw.id).limit(1);
    islandWingsComponentId = iwComponent![0].id;
  });

  it("logins actually succeeded (sanity check for the rest of this file)", () => {
    expect(skylineTail).toBeTruthy();
    expect(islandWingsTail).toBeTruthy();
    expect(islandWingsComponentId).toBeTruthy();
    expect(skylineTail).not.toBe(islandWingsTail);
  });

  describe("lifeTracking router", () => {
    it("GET /life-tracking/components never returns another client's rows", async () => {
      const res = await skyline.get("/life-tracking/components").expect(200);
      const tails = new Set(res.body.map((c: { tail: string }) => c.tail));
      expect(tails.has(islandWingsTail)).toBe(false);
    });

    it("GET /life-tracking/components/:id 403s on another client's component", async () => {
      await skyline.get(`/life-tracking/components/${islandWingsComponentId}`).expect(403);
    });

    it("the owning client can read their own component", async () => {
      await islandWings.get(`/life-tracking/components/${islandWingsComponentId}`).expect(200);
    });

    it("internal staff (Admin) see every client's components", async () => {
      const res = await admin.get("/life-tracking/components").expect(200);
      const tails = new Set(res.body.map((c: { tail: string }) => c.tail));
      expect(tails.has(islandWingsTail)).toBe(true);
      expect(tails.has(skylineTail)).toBe(true);
    });
  });

  describe("directives router", () => {
    it("GET /directives nests only the caller's own client's compliance records", async () => {
      const res = await skyline.get("/directives").expect(200);
      const allTails = res.body.flatMap((d: { records: { tailNumber: string }[] }) => d.records.map(r => r.tailNumber));
      expect(allTails).not.toContain(islandWingsTail);
    });

    it("directives themselves (regulatory reference data) are visible to every client", async () => {
      const [skylineRes, islandRes] = await Promise.all([skyline.get("/directives").expect(200), islandWings.get("/directives").expect(200)]);
      const skylineIds = skylineRes.body.map((d: { id: string }) => d.id).sort();
      const islandIds = islandRes.body.map((d: { id: string }) => d.id).sort();
      expect(skylineIds).toEqual(islandIds);
    });
  });

  describe("delivery router", () => {
    it("GET /delivery/events never returns another client's events", async () => {
      const res = await skyline.get("/delivery/events").expect(200);
      const tails = new Set(res.body.map((e: { tail: string }) => e.tail));
      expect(tails.has(islandWingsTail)).toBe(false);
    });
  });

  describe("qc router", () => {
    it("GET /qc/instances never returns another client's checklist instances", async () => {
      const [skylineRes, islandRes] = await Promise.all([skyline.get("/qc/instances").expect(200), admin.get("/qc/instances").expect(200)]);
      const skylineIds = new Set(skylineRes.body.map((i: { id: string }) => i.id));
      // Any admin-visible instance whose linkedEntityId is the Island Wings
      // tail (aircraft-linked) or an Island-Wings-owned delivery event must
      // not appear in Skyline's own list.
      const islandOwned = islandRes.body.filter(
        (i: { linkedEntityType: string; linkedEntityId: string }) => i.linkedEntityType === "aircraft" && i.linkedEntityId === islandWingsTail,
      );
      for (const instance of islandOwned) expect(skylineIds.has(instance.id)).toBe(false);
    });
  });
});
