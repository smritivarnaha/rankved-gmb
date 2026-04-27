"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

const RECAPTCHA_SITE_KEY = "6Lf1lrwsAAAAAMSCfj2I-Hrusva3fWQ0mfGE8V3b";

interface LoginFormProps {
  settings: {
    loginBgUrl: string;
    loginHeading: string;
    loginDescription: string;
    loginBgOpacity: number;
  };
}

export function LoginForm({ settings }: LoginFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const render = () => {
      const el = document.getElementById("g-recaptcha");
      if (!el || el.childElementCount > 0) return;
      try {
        (window as any).grecaptcha.render("g-recaptcha", {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (t: string) => setCaptchaToken(t),
          "expired-callback": () => setCaptchaToken(null),
          theme: "light",
          size: "normal",
        });
      } catch {}
    };
    if ((window as any).grecaptcha?.render) {
      render();
    } else {
      const s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      s.async = true;
      s.onload = () => (window as any).grecaptcha?.ready(render);
      document.head.appendChild(s);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) { setError("Please complete the captcha verification below."); return; }
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email: identifier, password, redirect: false });
    if (result?.error) { setError("Invalid username/email or password."); setLoading(false); }
    else window.location.href = "/dashboard";
  };

  return (
    <div className="login-shell">
      {/* ── LEFT PANEL ── */}
      <div className="login-left" style={{ backgroundImage: `url(${settings.loginBgUrl})` }}>
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          background: `linear-gradient(to bottom, rgba(0,0,0,${settings.loginBgOpacity * 0.5}) 0%, rgba(0,0,0,${settings.loginBgOpacity}) 100%)`, 
          zIndex: 0 
        }} />
        
        <div className="left-logo">
          <div className="left-logo-icon">
            <MapPin style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <span className="left-logo-name">RankVed</span>
        </div>
        
        <div className="left-body">
          <h1 className="left-tagline" style={{ color: "#fff", zIndex: 1 }}>
            {settings.loginHeading}
          </h1>
          <p className="left-sub" style={{ color: "rgba(255,255,255,0.9)", zIndex: 1, fontWeight: 500 }}>
            {settings.loginDescription}
          </p>
        </div>

        <div className="left-footer">
          <p className="left-stat">
            <strong>Trusted by 100+ healthcare practices</strong><br />
            across India · UAE · UK · United States
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <img 
              src="https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif" 
              alt="RankVed" 
              style={{ height: 32, width: "auto", display: "block" }} 
            />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.02em" }}>
              GMB Manager
            </span>
          </div>
          <p className="form-subheading">Sign in to your account</p>

          {error && (
            <div className="form-error">
              <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="login-identifier">Email or Username</label>
              </div>
              <input
                id="login-identifier"
                className="field-input"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@practice.com"
                required
                autoComplete="username"
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="login-password">Password</label>
                <a href="#" className="field-forgot">Forgot password?</a>
              </div>
              <input
                id="login-password"
                className="field-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="remember"
                className="checkbox-custom"
                defaultChecked
              />
              <label htmlFor="remember" className="checkbox-label">
                Remember me for 30 days
              </label>
            </div>

            <div className="recaptcha-wrap">
              <div id="g-recaptcha" />
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading && <Loader2 style={{ width: 15, height: 15 }} className="spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="form-divider" />
            <p className="form-footer-text">
              Don't have access?{" "}
              <span style={{ color: "#27272A", fontWeight: 500 }}>Contact your admin.</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
