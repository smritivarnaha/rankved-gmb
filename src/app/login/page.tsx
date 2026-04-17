"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

const RECAPTCHA_SITE_KEY = "6Lf1lrwsAAAAAMSCfj2I-Hrusva3fWQ0mfGE8V3b";

const features = [
  "Manage multiple business profiles from one login",
  "Plan and schedule posts in advance",
  "Optimize images automatically for posting",
  "Maintain consistent activity across listings",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
    if (!captchaToken) { setError("Please complete the captcha first."); return; }
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid email or password."); setLoading(false); }
    else window.location.href = "/dashboard";
  };

  const handleGoogle = async () => {
    if (!captchaToken) { setError("Please complete the captcha first."); return; }
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        .login-root {
          min-height: 100vh;
          display: flex;
        }

        /* LEFT — background image panel */
        .left-panel {
          width: 55%;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 52px 40px 48px;
          background: linear-gradient(160deg, #0b1e3d 0%, #1a3a6e 45%, #2055b5 75%, #3b82f6 100%);
          background-repeat: no-repeat;
        }

        .left-inner { position: relative; z-index: 1; }


        /* RIGHT panel */
        .right-panel {
          flex: 1;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
        }
        .form-card { width: 100%; max-width: 380px; }

        .field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .field-input {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; font-size: 14px;
          font-family: inherit; outline: none; color: #0f172a;
          transition: border-color 0.15s;
        }
        .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

        .btn-signin {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(79,70,229,0.3);
          transition: opacity 0.15s, transform 0.1s;
        }
        .btn-signin:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .btn-signin:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-google {
          width: 100%; padding: 12px; border-radius: 12px;
          border: 1.5px solid #e2e8f0; background: #fff;
          cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600;
          color: #0f172a; display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .btn-google:hover:not(:disabled) { background: #f8fafc; border-color: #c7d2fe; transform: translateY(-1px); }
        .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 12; margin: 20px 0; }
        .divider-line { flex: 1; height: 1px; background: #f1f5f9; }
        .divider-text { font-size: 11px; color: #cbd5e1; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }

        @media (max-width: 900px) {
          .left-panel { display: none; }
          .right-panel { padding: 32px 20px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          {/* Logo — only here, only once */}
          <div className="left-inner" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/rankved-logo.png"
              alt="RankVed"
              width={44}
              height={44}
              style={{ borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
            />
            <div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 17, lineHeight: 1.2, letterSpacing: "-0.02em" }}>RankVed</p>
              <p style={{ color: "rgba(200,225,255,0.7)", fontSize: 12, fontWeight: 500 }}>GMB Manager</p>
            </div>
          </div>

          {/* Hero */}
          <div className="left-inner">
            <h1 style={{
              color: "#fff", fontWeight: 800, lineHeight: 1.18,
              letterSpacing: "-0.03em", marginBottom: 16,
              fontSize: "clamp(26px, 2.6vw, 38px)",
            }}>
              Your Google Business,{" "}
              <span style={{ background: "linear-gradient(90deg, #93c5fd, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Managed in One Place.
              </span>
            </h1>
            <p style={{ color: "rgba(210,230,255,0.65)", fontSize: 14.5, lineHeight: 1.75, maxWidth: 420, marginBottom: 36 }}>
              Connect your Google account and manage all your business profiles from a single dashboard. Plan posts, schedule updates, and keep every listing active without switching accounts.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: "1.5px solid rgba(147,197,253,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ color: "rgba(210,230,255,0.85)", fontSize: 14, fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="left-inner" style={{ color: "rgba(180,210,255,0.25)", fontSize: 11, fontWeight: 500 }}>
            © {new Date().getFullYear()} RankVed Technologies. All rights reserved.
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-card">
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: "#64748b" }}>
                Sign in to access your business dashboard
              </p>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 18 }}>
                <AlertCircle size={15} color="#dc2626" />
                <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              <div>
                <label className="field-label">Email address</label>
                <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••••" />
              </div>

              {/* reCAPTCHA */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div id="g-recaptcha" />
              </div>

              {/* Primary Sign In */}
              <button type="submit" className="btn-signin" disabled={loading}>
                {loading && <Loader2 size={16} className="spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or continue with Google</span>
              <div className="divider-line" />
            </div>

            {/* Google — below the form */}
            <button className="btn-google" onClick={handleGoogle} disabled={googleLoading} style={{ marginTop: 12 }}>
              {googleLoading ? (
                <Loader2 size={18} color="#6366f1" className="spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.85v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.59l2.66-2.07z"/>
                  <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9l2.87 2.07C4.14 4.98 6.23 3.58 8.98 3.58z"/>
                </svg>
              )}
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            {/* Legal — only thing at the very bottom */}
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.6, marginTop: 28 }}>
              By signing in, you agree to our{" "}
              <Link href="/terms-of-service" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy-policy" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
