import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/layout/BrandMark";
import { ROUTES } from "@/routes";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, login } = useAuth();

  if (user) return <Redirect to={ROUTES.dashboard} />;

  const attemptLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(ROUTES.dashboard);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-photo" />
      <div className="login-stripes" />
      <div className="login-card">
        <BrandMark />
        <div className="login-rule" />
        <h1><span>WingBox</span> <b>Aviation</b></h1>
        <p>Moving Toward Excellence — Digitally.</p>
        <label>Email address
          <div className="input-icon">
            <UserRound size={16} />
            <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your work email" />
          </div>
        </label>
        <label>Password
          <div className="input-icon">
            <LockKeyhole size={16} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              onKeyDown={e => e.key === "Enter" && void attemptLogin()}
            />
          </div>
        </label>
        <button className="forgot" onClick={() => toast("Ask a WingBox admin to reset your password.")}>Forgot password?</button>
        <button className="primary-button login-button" onClick={() => void attemptLogin()} disabled={submitting}>{submitting ? "Signing in…" : "Sign in"} <ArrowRight size={16} /></button>
        <p className="role-login-note"><UserRound size={15} /> Engineer, QA, Planner, Admin and Client accounts all sign in here — your role comes from your account.</p>
      </div>
    </div>
  );
}
