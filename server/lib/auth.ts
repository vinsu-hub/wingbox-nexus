import type { NextFunction, Request, Response } from "express";
import { createClient, type Session } from "@supabase/supabase-js";
import { supabase } from "./supabase.js";

export type Role = "Engineer" | "Planner" | "QA" | "Admin" | "Client";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export const PROFILES_TABLE = "profiles";
const ACCESS_COOKIE = "wb_access";
const REFRESH_COOKIE = "wb_refresh";
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** A fresh, stateless client for each auth call. Calling signInWithPassword
 * or refreshSession on the shared service-role `supabase` client would make
 * supabase-js switch that client to the *user's* token for every later
 * database query server-wide. */
export function createAuthClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function readCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map(part => {
      const index = part.indexOf("=");
      return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }),
  );
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

export function setSessionCookies(res: Response, session: Session) {
  res.cookie(ACCESS_COOKIE, session.access_token, cookieOptions(session.expires_in * 1000));
  res.cookie(REFRESH_COOKIE, session.refresh_token, cookieOptions(REFRESH_MAX_AGE_MS));
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

export async function loadProfile(userId: string, email: string): Promise<SessionUser | null> {
  const { data, error } = await supabase.from(PROFILES_TABLE).select("role, display_name").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return { id: userId, email, role: data.role as Role, displayName: data.display_name };
}

/** Resolves the caller from their cookies, silently refreshing an expired
 * access token with the refresh token and re-issuing both cookies. Returns
 * null when there's no valid session or the user has no profile. */
export async function resolveSession(req: Request, res: Response): Promise<SessionUser | null> {
  const cookies = readCookies(req);
  const client = createAuthClient();

  if (cookies[ACCESS_COOKIE]) {
    const { data } = await client.auth.getUser(cookies[ACCESS_COOKIE]);
    if (data.user?.email) return loadProfile(data.user.id, data.user.email);
  }
  if (cookies[REFRESH_COOKIE]) {
    const { data } = await client.auth.refreshSession({ refresh_token: cookies[REFRESH_COOKIE] });
    if (data.session && data.user?.email) {
      setSessionCookies(res, data.session);
      return loadProfile(data.user.id, data.user.email);
    }
  }
  return null;
}

/** Every /api route except /auth/* goes through this. Client-role users are
 * read-only across the internal API. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveSession(req, res);
    if (!user) {
      clearSessionCookies(res);
      res.status(401).json({ error: "Sign in required." });
      return;
    }
    if (user.role === "Client" && req.method !== "GET") {
      res.status(403).json({ error: "Client accounts are read-only." });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Session check failed" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: `Requires one of: ${roles.join(", ")}.` });
      return;
    }
    next();
  };
}

/** Who to record in the audit log: always the authenticated user, never a
 * name typed into a form (forms still capture domain fields like
 * complied_by / signed_off_by, which can legitimately differ). */
export const auditActor = (req: Request) => (req.user ? `${req.user.displayName} <${req.user.email}>` : "unknown");
