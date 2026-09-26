import { Router } from "express";
import { z } from "zod";
import { clearSessionCookies, createAuthClient, loadProfile, resolveSession, setSessionCookies } from "../lib/auth.js";
import { recordAuditEvent } from "../lib/auditLog.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }
  try {
    const { data, error } = await createAuthClient().auth.signInWithPassword(parsed.data);
    if (error || !data.session || !data.user.email) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const user = await loadProfile(data.user.id, data.user.email);
    if (!user) {
      res.status(403).json({ error: "This account has no WingBox profile." });
      return;
    }
    setSessionCookies(res, data.session);
    await recordAuditEvent({
      actor: `${user.displayName} <${user.email}>`,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Login failed" });
  }
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookies(res);
  res.status(204).end();
});

authRouter.get("/me", async (req, res) => {
  try {
    const user = await resolveSession(req, res);
    if (!user) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Session check failed" });
  }
});
