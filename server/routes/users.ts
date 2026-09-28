import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { auditActor, requireRole, type Role } from "../lib/auth.js";
import { PROFILES_TABLE } from "../lib/auth.js";

export const usersRouter = Router();

const ROLES: Role[] = ["Engineer", "Planner", "QA", "Admin", "Client"];

/** Admin-only, per Foundations ("Real Users and Roles page over profiles
 * and the Supabase admin API (Admin only). No self-service role changes.").
 * Joins profiles with auth.users (via the admin API) for last-sign-in and
 * account-disabled state, which profiles alone doesn't carry. */
usersRouter.get("/", requireRole("Admin"), async (_req, res) => {
  try {
    const [{ data: profiles, error: profilesError }, { data: authUsers, error: authError }] = await Promise.all([
      supabase.from(PROFILES_TABLE).select("id, email, role, display_name, client_id, clients(name)").order("email"),
      supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    if (profilesError) {
      res.status(502).json({ error: `Lookup failed: ${profilesError.message}` });
      return;
    }
    if (authError) {
      res.status(502).json({ error: `Auth lookup failed: ${authError.message}` });
      return;
    }
    const authById = new Map(authUsers.users.map(u => [u.id, u]));
    res.json(
      (profiles ?? []).map(row => {
        const auth = authById.get(row.id as string);
        return {
          id: row.id,
          email: row.email,
          role: row.role,
          displayName: row.display_name,
          clientId: row.client_id,
          clientName: (row as unknown as { clients: { name: string } | null }).clients?.name ?? null,
          lastSignInAt: auth?.last_sign_in_at ?? null,
          disabled: auth?.banned_until ? new Date(auth.banned_until) > new Date() : false,
        };
      }),
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

const updateSchema = z.object({ role: z.enum(ROLES as [Role, ...Role[]]).optional(), disabled: z.boolean().optional() });

/** Role changes and enable/disable — both real, both audited. Still no
 * self-service: Admin only, and a caller can't change their own role (the
 * one guardrail Foundations' "no self-service role changes" clearly wants —
 * an Admin locking themselves out, or quietly self-promoting, is exactly
 * the failure mode a single-admin system is most exposed to). */
usersRouter.patch("/:id", requireRole("Admin"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide role and/or disabled." });
    return;
  }
  if (req.params.id === req.user!.id) {
    res.status(403).json({ error: "You can't change your own role or access from this page." });
    return;
  }
  try {
    const { data: before } = await supabase.from(PROFILES_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (!before) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (parsed.data.role) {
      const { error } = await supabase.from(PROFILES_TABLE).update({ role: parsed.data.role }).eq("id", req.params.id);
      if (error) {
        res.status(502).json({ error: `Update failed: ${error.message}` });
        return;
      }
    }
    if (parsed.data.disabled !== undefined) {
      const { error } = await supabase.auth.admin.updateUserById(req.params.id, {
        ban_duration: parsed.data.disabled ? "876000h" : "none", // ~100 years / lift
      });
      if (error) {
        res.status(502).json({ error: `Access update failed: ${error.message}` });
        return;
      }
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: "user.update",
      entityType: "profile",
      entityId: req.params.id,
      beforeState: before,
      afterState: parsed.data,
    });
    res.json({ id: req.params.id, ...parsed.data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown update error" });
  }
});
