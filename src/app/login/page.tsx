"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const RECAPTCHA_SITE_KEY = "6Lf1lrwsAAAAAMSCfj2I-Hrusva3fWQ0mfGE8V3b";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
    const result = await signIn("credentials", { email: identifier, password, redirect: false });
    if (result?.error) { setError("Invalid username/email or password."); setLoading(false); }
    else window.location.href = "/dashboard";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; 
          background-color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        .form-card { 
          width: 100%; 
          max-width: 400px; 
          background: #fff;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #e2e8f0;
        }

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
          margin-top: 20px;
        }
        .btn-signin:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .btn-signin:disabled { opacity: 0.55; cursor: not-allowed; }

        @media (max-width: 480px) {
          body { padding: 16px; }
          .form-card { padding: 24px; }
        }
      `}</style>

      <div className="form-card">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="RankVed"
            width={120}
            style={{ margin: "0 auto 24px auto", display: "block", objectFit: "contain" }}
          />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 6 }}>
            RankVed GMB Manager
          </h2>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 18 }}>
            <AlertCircle size={15} color="#dc2626" />
            <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="field-label">Email or Username</label>
            <input className="field-input" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder="admin" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••••" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input type="checkbox" id="remember" defaultChecked style={{ width: 16, height: 16, accentColor: "#4f46e5", cursor: "pointer" }} />
            <label htmlFor="remember" style={{ fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 500 }}>Remember me for 30 days</label>
          </div>

          {/* reCAPTCHA */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <div id="g-recaptcha" />
          </div>

          {/* Primary Sign In */}
          <button type="submit" className="btn-signin" disabled={loading}>
            {loading && <Loader2 size={16} className="spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </>
  );
}
