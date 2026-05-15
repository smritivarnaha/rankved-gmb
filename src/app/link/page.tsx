"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function DirectLinkPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Admin ID for RankVed
    const ADMIN_ID = "cmo33rkyy0000jm04n975frer";
    document.cookie = `linkUserId=${ADMIN_ID}; path=/; max-age=3600; samesite=lax`;

    // Animate progress bar before redirect
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18;
      if (p > 88) p = 88; // stop at 88% until Google responds
      setProgress(Math.min(p, 88));
    }, 200);

    // Redirect to Google OAuth immediately
    const timer = setTimeout(() => {
      signIn("google", { callbackUrl: "/onboard/success" });
    }, 800);

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes innerSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes bgFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-20px) scale(1.02); }
        }
        @keyframes dotSequence {
          0%   { opacity: 0.2; transform: scale(0.8); }
          33%  { opacity: 1;   transform: scale(1.2); }
          66%  { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
        .logo-anim { animation: fadeIn 0.7s ease-out 0s both; }
        .spinner-anim { animation: fadeIn 0.7s ease-out 0.2s both; }
        .text-anim  { animation: fadeIn 0.7s ease-out 0.4s both; }
        .bar-anim   { animation: fadeIn 0.7s ease-out 0.6s both; }
        .orbit      { animation: orbitSpin 1.8s linear infinite; }
        .inner-dot  { animation: innerSpin 1.8s linear infinite; }
        .seq-1 { animation: dotSequence 1.5s ease-in-out 0.0s infinite; }
        .seq-2 { animation: dotSequence 1.5s ease-in-out 0.5s infinite; }
        .seq-3 { animation: dotSequence 1.5s ease-in-out 1.0s infinite; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden"
      }}>
        {/* Decorative background blobs */}
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          animation: "bgFloat 6s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "15%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          animation: "bgFloat 8s ease-in-out 2s infinite"
        }} />

        <div style={{ textAlign: "center", maxWidth: 400, position: "relative", zIndex: 1 }}>
          {/* Brand logo */}
          <div className="logo-anim" style={{ marginBottom: 40 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 100, padding: "8px 20px"
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.5"/>
                  <path d="M3.5 6h5M6 3.5v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.05em" }}>
                RANKVED GBP
              </span>
            </div>
          </div>

          {/* Orbital spinner */}
          <div className="spinner-anim" style={{ position: "relative", width: 120, height: 120, margin: "0 auto 40px" }}>
            {/* Outer ring */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.06)"
            }} />
            {/* Spinning arc */}
            <svg
              className="orbit"
              style={{ position: "absolute", inset: 0 }}
              width="120" height="120" viewBox="0 0 120 120"
            >
              <circle cx="60" cy="60" r="54" fill="none"
                stroke="url(#blueGrad)" strokeWidth="3"
                strokeDasharray="80 260" strokeLinecap="round"
              />
              <defs>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>
            {/* Inner pulse */}
            <div style={{
              position: "absolute", inset: 20,
              borderRadius: "50%",
              background: "rgba(37,99,235,0.15)",
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(37,99,235,0.3)"
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3C7.925 3 3 7.925 3 14s4.925 11 11 11 11-4.925 11-11S20.075 3 14 3z" stroke="#60A5FA" strokeWidth="1.5" opacity="0.4"/>
                <path d="M14 7v7l4 4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-anim">
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: "#FFFFFF",
              margin: "0 0 12px", letterSpacing: "-0.02em"
            }}>
              Connecting to Google
            </h2>
            <p style={{
              fontSize: 15, color: "rgba(255,255,255,0.5)",
              margin: "0 0 32px", fontWeight: 500, lineHeight: 1.6
            }}>
              Authenticating your business profile access...
            </p>
          </div>

          {/* Progress bar */}
          <div className="bar-anim">
            <div style={{
              height: 4, background: "rgba(255,255,255,0.08)",
              borderRadius: 100, overflow: "hidden", marginBottom: 16
            }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: "linear-gradient(90deg, #2563EB, #60A5FA)",
                borderRadius: 100,
                transition: "width 0.3s ease",
                boxShadow: "0 0 12px rgba(96,165,250,0.6)"
              }} />
            </div>

            {/* Status dots */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div className="seq-1" style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />
              <div className="seq-2" style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />
              <div className="seq-3" style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 8, fontWeight: 500 }}>
                Secure OAuth 2.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
