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
    // Automatic redirect removed to debug reload loop
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..900;1,14..32,300..900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          background: #FAFAFA;
          display: flex;
          align-items: stretch;
          min-height: 100vh;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        /* ── Split layout ── */
        .login-shell {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        /* ── Left panel (dark) ── */
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 48px;
          position: relative;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* Dot grid background pattern */
        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Subtle gradient orb */
        .login-left::after {
          content: '';
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(37,99,235,0.12) 0%, transparent 70%);
          top: -100px;
          right: -120px;
          pointer-events: none;
        }

        .left-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .left-logo-icon {
          width: 36px;
          height: 36px;
          background: #1E40AF;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .left-logo-name {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.01em;
        }

        .left-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
          max-width: 440px;
        }
        .left-tagline {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .left-tagline span {
          color: rgba(255,255,255,0.35);
        }
        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
          max-width: 380px;
        }

        .left-footer {
          position: relative;
          z-index: 1;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .left-stat {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          line-height: 1.6;
        }
        .left-stat strong {
          color: rgba(255,255,255,0.6);
          font-weight: 600;
        }

        /* ── Right panel (form) ── */
        .login-right {
          width: 480px;
          flex-shrink: 0;
          background: #FAFAFA;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          border-left: 1px solid rgba(0,0,0,0.06);
        }

        .login-form-wrap {
          width: 100%;
          max-width: 360px;
        }

        /* Logo & heading */
        .form-heading {
          font-size: 24px;
          font-weight: 600;
          color: #0A0A0A;
          letter-spacing: -0.025em;
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .form-subheading {
          font-size: 14px;
          color: #71717A;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        /* Error banner */
        .form-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          margin-bottom: 20px;
          font-size: 13px;
          color: #991B1B;
        }

        /* Field */
        .field-group { margin-bottom: 16px; }
        .field-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: #27272A;
        }
        .field-forgot {
          font-size: 13px;
          color: #71717A;
          text-decoration: none;
          transition: color 0.1s;
        }
        .field-forgot:hover { color: #0A0A0A; text-decoration: underline; }

        .field-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.10);
          background: #FFFFFF;
          font-size: 14px;
          font-family: inherit;
          color: #0A0A0A;
          outline: none;
          transition: border-color 0.1s, box-shadow 0.1s;
        }
        .field-input::placeholder { color: #A1A1AA; }
        .field-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.08);
        }

        /* Checkbox row */
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 20px;
        }
        .checkbox-custom {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.18);
          background: #fff;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: background 0.1s, border-color 0.1s;
        }
        .checkbox-custom:checked {
          background: #0A0A0A;
          border-color: #0A0A0A;
        }
        .checkbox-custom:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 2px;
          width: 5px;
          height: 8px;
          border: 2px solid #fff;
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
        }
        .checkbox-label {
          font-size: 13px;
          color: #52525B;
          cursor: pointer;
        }

        /* reCAPTCHA wrapper */
        .recaptcha-wrap {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          padding: 16px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 8px;
        }

        /* Sign in button */
        .btn-signin {
          width: 100%;
          height: 44px;
          border-radius: 8px;
          border: none;
          background: #0A0A0A;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: -0.01em;
          transition: background 0.1s;
        }
        .btn-signin:hover:not(:disabled) { background: #18181B; }
        .btn-signin:active:not(:disabled) { background: #27272A; }
        .btn-signin:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Footer */
        .form-divider {
          height: 1px;
          background: rgba(0,0,0,0.07);
          margin: 20px 0;
        }
        .form-footer-text {
          text-align: center;
          font-size: 13px;
          color: #71717A;
          line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .login-left { display: none; }
          .login-right {
            width: 100%;
            border-left: none;
            padding: 32px 24px;
          }
        }
        @media (max-width: 480px) {
          .login-right { padding: 24px 20px; }
        }
      `}</style>
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
