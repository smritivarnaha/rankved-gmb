"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export default function OnboardSuccessPage() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // ── Block the back button ─────────────────────────────────────────────
    // Push a duplicate entry so the back button stays on this page.
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    // Entrance animation
    setTimeout(() => setShow(true), 80);

    // Background profile sync (silent, non-blocking)
    fetch("/api/profiles", { method: "POST" }).catch(() => {});

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes successPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          80%  { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes checkDraw {
          0%   { stroke-dashoffset: 100; opacity: 0; }
          30%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes starPop {
          0%   { transform: scale(0) translate(0,0); opacity: 1; }
          100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.15); }
          50%       { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
        }

        .success-icon  { animation: successPop 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.25s both; }
        .ring-1        { animation: ringPulse 1.6s ease-out 0.85s infinite; }
        .ring-2        { animation: ringPulse 1.6s ease-out 1.25s infinite; }
        .check-draw    { stroke-dasharray: 100; animation: checkDraw 0.65s ease-out 0.85s both; }
        .t1 { animation: fadeSlideUp 0.55s ease-out 0.95s both; }
        .t2 { animation: fadeSlideUp 0.55s ease-out 1.10s both; }
        .t3 { animation: fadeSlideUp 0.55s ease-out 1.25s both; }
        .t4 { animation: fadeSlideUp 0.55s ease-out 1.40s both; }

        .star { position:absolute; width:7px; height:7px; border-radius:50%;
                animation: starPop 0.9s ease-out 0.5s both; }
        .d1 { animation: dotBounce 1.2s ease-in-out 0.0s infinite; }
        .d2 { animation: dotBounce 1.2s ease-in-out 0.2s infinite; }
        .d3 { animation: dotBounce 1.2s ease-in-out 0.4s infinite; }

        .icon-circle { animation: subtlePulse 2.5s ease-in-out 1.5s infinite; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden"
      }}>
        {/* Subtle white background grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, #E8EFFE 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.5
        }} />
        {/* Blue glow top-center */}
        <div style={{
          position: "absolute", top: "-10%", left: "50%",
          transform: "translateX(-50%)",
          width: 700, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)"
        }} />

        <div style={{
          maxWidth: 480, width: "100%", position: "relative", zIndex: 1,
          opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease, transform 0.5s ease"
        }}>
          {/* Card */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 28,
            border: "1px solid #E8EFFE",
            padding: "52px 44px 44px",
            textAlign: "center",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02), 0 12px 40px rgba(37,99,235,0.07), 0 40px 80px rgba(0,0,0,0.04)",
            position: "relative", overflow: "hidden"
          }}>
            {/* Top accent bar */}
            <div style={{
              position: "absolute", top: 0, left: "25%", right: "25%",
              height: 3, borderRadius: "0 0 6px 6px",
              background: "linear-gradient(90deg, #2563EB, #93C5FD, #2563EB)"
            }} />

            {/* Success icon */}
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 32px" }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "2px solid #2563EB"
              }} className="ring-1" />
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "2px solid #93C5FD"
              }} className="ring-2" />

              <div className="success-icon icon-circle" style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 16px 40px rgba(37,99,235,0.32)"
              }}>
                <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                  <path d="M11 24l8.5 8.5 15.5-18"
                    stroke="white" strokeWidth="4"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="check-draw" />
                </svg>
              </div>

              {/* Particles */}
              {[
                { bg: "#FCD34D", tx: "-54px", ty: "-44px" },
                { bg: "#34D399", tx:  "54px", ty: "-44px" },
                { bg: "#F87171", tx: "-48px", ty:  "42px" },
                { bg: "#60A5FA", tx:  "48px", ty:  "42px" },
                { bg: "#A78BFA", tx:   "0px", ty: "-65px" },
                { bg: "#FB923C", tx: "-68px", ty:   "0px" },
                { bg: "#2DD4BF", tx:  "68px", ty:   "0px" },
              ].map((s, i) => (
                <div key={i} className="star" style={{
                  background: s.bg, top: "50%", left: "50%",
                  marginTop: -3.5, marginLeft: -3.5,
                  "--tx": s.tx, "--ty": s.ty,
                  animationDelay: `${0.45 + i * 0.05}s`
                } as any} />
              ))}
            </div>

            {/* Heading */}
            <h1 className="t1" style={{
              fontSize: 34, fontWeight: 900, color: "#0F172A",
              margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.1
            }}>
              Access Granted! 🎉
            </h1>

            {/* Subtext */}
            <p className="t2" style={{
              fontSize: 16, color: "#475569", lineHeight: 1.7,
              margin: "0 0 36px", fontWeight: 500
            }}>
              Thank you for giving your business profile access.<br />
              <strong style={{ color: "#111827", fontWeight: 700 }}>
                Our team will get in touch with you soon.
              </strong>
            </p>

            {/* Info card */}
            <div className="t3" style={{
              background: "#F8FAFF",
              borderRadius: 16, border: "1px solid #DBEAFE",
              padding: "20px 24px", textAlign: "left", marginBottom: 36
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div className="d1" style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563EB" }} />
                <div className="d2" style={{ width: 7, height: 7, borderRadius: "50%", background: "#93C5FD" }} />
                <div className="d3" style={{ width: 7, height: 7, borderRadius: "50%", background: "#BFDBFE" }} />
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#2563EB",
                  textTransform: "uppercase", letterSpacing: "0.12em", marginLeft: 6
                }}>
                  Configuring in background
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.65 }}>
                We're internally setting up your business profiles for management. No further action required — you may safely close this window.
              </p>
            </div>

            {/* Brand footer */}
            <div className="t4" style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8
            }}>
              <Globe size={13} style={{ color: "#CBD5E1" }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#94A3B8",
                textTransform: "uppercase", letterSpacing: "0.08em"
              }}>
                Powered by RankVed
              </span>
            </div>
          </div>

          {/* Below-card note */}
          <p style={{
            textAlign: "center", fontSize: 12, color: "#94A3B8",
            marginTop: 20, fontWeight: 500
          }}>
            🔒 This session is secured and cannot be navigated back
          </p>
        </div>
      </div>
    </>
  );
}
