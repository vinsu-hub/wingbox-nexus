import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Engineer" | "Planner" | "QA" | "Admin" | "Client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

interface AuthContextValue {
  /** undefined while the session check is in flight, null when signed out. */
  user: AuthUser | null | undefined;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** The session lives in httpOnly cookies set by /api/auth/*; the client only
 * ever learns who is signed in via /api/auth/me. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(response => (response.ok ? response.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Sign in failed.");
    setUser(body as AuthUser);
    return body as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join("");
