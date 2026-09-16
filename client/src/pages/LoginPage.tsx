import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/layout/BrandMark";
import { ROUTES } from "@/routes";

export function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const attemptLogin = () => {
    if (email === "admin" && password === "admin123") navigate(ROUTES.dashboard);
    else toast.error("Invalid email or password");
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
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your work email" />
          </div>
        </label>
        <label>Password
          <div className="input-icon">
            <LockKeyhole size={16} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={e => e.key === "Enter" && attemptLogin()}
            />
          </div>
        </label>
        <button className="forgot" onClick={() => toast("Password reset link requested")}>Forgot password?</button>
        <button className="primary-button login-button" onClick={attemptLogin}>Sign in <ArrowRight size={16} /></button>
        <div className="or"><span />or<span /></div>
        <button className="role-login" onClick={attemptLogin}><UserRound size={17} /> Engineer / Client / Admin login</button>
      </div>
    </div>
  );
}
