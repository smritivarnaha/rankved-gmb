"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

type Phase = "checking" | "connecting" | "already_connected";

export default function DirectLinkPage() {
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<Phase>("checking");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === "loading") return; // wait for session to resolve

    if (status === "authenticated" && session?.user) {
      // ── Already connected ──────────────────────────────────────
      // Check if they have a Google account linked
      setPhase("already_connected");
      return;
    }

    // ── Not signed in — start OAuth flow ──────────────────────────
    setPhase("connecting");

    const ADMIN_ID = "cmo33rkyy0000jm04n975frer";
    document.cookie = `linkUserId=${ADMIN_ID}; path=/; max-age=3600; samesite=lax`;

    // Animate progress bar
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 16;
      if (p > 85) p = 85;
      setProgress(Math.min(p, 85));
    }, 220);

    const timer = setTimeout(() => {
      signIn("google", { callbackUrl: "/onboard/success" });
    }, 900);

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [status, session]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dotSeq {
          0%   { opacity: 0.2; transform: scale(0.8); }
          33%  { opacity: 1;   transform: scale(1.3); }
          66%  { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
        @keyframes checkPop {
          0%  { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100%{ transform: scale(1); opacity: 1; }
        }
        @keyframes bgFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-16px); }
        }

        .a0 { animation: fadeIn 0.6s ease-out 0.0s both; }
        .a1 { animation: fadeIn 0.6s ease-out 0.15s both; }
        .a2 { animation: fadeIn 0.6s ease-out 0.30s both; }
        .a3 { animation: fadeIn 0.6s ease-out 0.45s both; }
        .a4 { animation: fadeIn 0.6s ease-out 0.60s both; }
        .orbit { animation: orbitSpin 2s linear infinite; }
        .s1 { animation: dotSeq 1.4s ease-in-out 0.0s infinite; }
        .s2 { animation: dotSeq 1.4s ease-in-out 0.45s infinite; }
        .s3 { animation: dotSeq 1.4s ease-in-out 0.9s infinite; }
        .check-pop { animation: checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden"
      }}>
        {/* Dot grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "28px 28px", opacity: 0.6
        }} />
        {/* Top blue glow */}
        <div style={{
          position: "absolute", top: "-8%", left: "50%",
          transform: "translateX(-50%)",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 65%)",
          animation: "bgFloat 7s ease-in-out infinite"
        }} />

        <div style={{
          maxWidth: 440, width: "100%", position: "relative", zIndex: 1,
          textAlign: "center"
        }}>
          {/* Brand pill */}
          <div className="a0" style={{ marginBottom: 40 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#F8FAFF", border: "1px solid #DBEAFE",
              borderRadius: 100, padding: "8px 18px"
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1.3"/>
                  <path d="M3 5h4M5 3v4" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.06em" }}>
                RANKVED GBP
              </span>
            </div>
          </div>

          {/* ── PHASE: CHECKING ───────────────────────── */}
          {phase === "checking" && (
            <>
              <div className="a1" style={{ margin: "0 auto 36px", width: 80, height: 80 }}>
                <svg className="orbit" width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#E8EFFE" strokeWidth="3"/>
                  <circle cx="40" cy="40" r="34" fill="none"
                    stroke="url(#g1)" strokeWidth="3"
                    strokeDasharray="55 160" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0"/>
                      <stop offset="100%" stopColor="#2563EB"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2 className="a2" style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
                Checking status...
              </h2>
              <p className="a3" style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
                Verifying your account with Google
              </p>
            </>
          )}

          {/* ── PHASE: CONNECTING ─────────────────────── */}
          {phase === "connecting" && (
            <>
              {/* Orbital spinner */}
              <div className="a1" style={{ position: "relative", width: 116, height: 116, margin: "0 auto 36px" }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid #EEF2FF"
                }} />
                <svg className="orbit" style={{ position: "absolute", inset: 0 }}
                  width="116" height="116" viewBox="0 0 116 116">
                  <circle cx="58" cy="58" r="52" fill="none"
                    stroke="url(#g2)" strokeWidth="3.5"
                    strokeDasharray="78 250" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0"/>
                      <stop offset="100%" stopColor="#60A5FA"/>
                    </linearGradient>
                  </defs>
                </svg>
                {/* Google "G" centre */}
                <div style={{
                  position: "absolute", inset: 20, borderRadius: "50%",
                  background: "#F8FAFF", border: "1px solid #DBEAFE",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
              </div>

              <h2 className="a2" style={{
                fontSize: 26, fontWeight: 900, color: "#0F172A",
                margin: "0 0 10px", letterSpacing: "-0.02em"
              }}>
                Connecting to Google
              </h2>
              <p className="a3" style={{
                fontSize: 15, color: "#64748B",
                margin: "0 0 32px", fontWeight: 500, lineHeight: 1.6
              }}>
                Redirecting to Google for secure authorization...
              </p>

              {/* Progress bar */}
              <div className="a4">
                <div style={{
                  height: 5, background: "#EEF2FF",
                  borderRadius: 100, overflow: "hidden", marginBottom: 14
                }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "linear-gradient(90deg, #2563EB, #60A5FA)",
                    borderRadius: 100, transition: "width 0.35s ease",
                    boxShadow: "0 0 10px rgba(37,99,235,0.4)"
                  }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <div className="s1" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }}/>
                  <div className="s2" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }}/>
                  <div className="s3" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }}/>
                  <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 8, fontWeight: 500 }}>
                    Secure OAuth 2.0
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ── PHASE: ALREADY CONNECTED ──────────────── */}
          {phase === "already_connected" && (
            <>
              <div className="a1" style={{ margin: "0 auto 32px" }}>
                <div className="check-pop" style={{
                  width: 88, height: 88, borderRadius: "50%", margin: "0 auto",
                  background: "linear-gradient(135deg, #059669, #10B981)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 12px 32px rgba(5,150,105,0.25)"
                }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M10 21l7 7 13-15" stroke="white" strokeWidth="3.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <h2 className="a2" style={{
                fontSize: 26, fontWeight: 900, color: "#0F172A",
                margin: "0 0 10px", letterSpacing: "-0.02em"
              }}>
                Already Connected ✓
              </h2>
              <p className="a3" style={{
                fontSize: 15, color: "#64748B",
                margin: "0 0 28px", fontWeight: 500, lineHeight: 1.65
              }}>
                Your Google account <strong style={{ color: "#0F172A" }}>
                  {session?.user?.email}
                </strong> is already linked to RankVed GBP Manager.
              </p>

              <div className="a4" style={{
                background: "#F0FDF9", border: "1px solid #A7F3D0",
                borderRadius: 14, padding: "16px 20px", textAlign: "left",
                marginBottom: 28
              }}>
                <p style={{ fontSize: 13, color: "#065F46", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                  ✅ Your profiles are being managed and you don't need to do anything else. Our team has everything they need.
                </p>
              </div>

              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                You may safely close this window.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
