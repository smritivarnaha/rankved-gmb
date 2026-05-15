"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export default function OnboardSuccessPage() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay for entrance animation impact
    setTimeout(() => setShow(true), 100);

    // Perform synchronization silently in the background
    const doSync = async () => {
      try {
        await fetch("/api/profiles", { method: "POST" });
      } catch (err) {
        console.error("Background sync failed:", err);
      }
    };
    doSync();
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
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes starPop {
          0%   { transform: scale(0) translate(0,0); opacity: 1; }
          100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 0; }
        }
        @keyframes bgGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }

        .success-icon { animation: successPop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.3s both; }
        .ring-pulse   { animation: ringPulse 1.4s ease-out 0.8s infinite; }
        .ring-pulse-2 { animation: ringPulse 1.4s ease-out 1.2s infinite; }
        .check-draw   { stroke-dasharray: 100; animation: checkDraw 0.6s ease-out 0.8s both; }
        .text-1       { animation: fadeSlideUp 0.6s ease-out 0.9s both; }
        .text-2       { animation: fadeSlideUp 0.6s ease-out 1.1s both; }
        .card-body    { animation: fadeSlideUp 0.6s ease-out 1.3s both; }
        .footer-fade  { animation: fadeSlideUp 0.6s ease-out 1.5s both; }

        .star { 
          position: absolute; 
          width: 8px; height: 8px; 
          border-radius: 50%;
          animation: starPop 0.8s ease-out 0.6s both;
        }

        .dot-1 { animation: dotBounce 1.4s ease-in-out 0s infinite; }
        .dot-2 { animation: dotBounce 1.4s ease-in-out 0.2s infinite; }
        .dot-3 { animation: dotBounce 1.4s ease-in-out 0.4s infinite; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #fafafa 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden"
      }}>
        {/* Background decorative glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
          animation: "bgGlow 4s ease-in-out infinite"
        }} />

        <div style={{
          maxWidth: 460, width: "100%", position: "relative",
          opacity: show ? 1 : 0, transition: "opacity 0.4s ease"
        }}>
          {/* Main Card */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 28,
            border: "1px solid #E8EFFE",
            padding: "52px 44px",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(37,99,235,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            position: "relative", overflow: "hidden"
          }}>
            {/* Top accent line */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%",
              height: 3, borderRadius: "0 0 4px 4px",
              background: "linear-gradient(90deg, #2563EB, #60A5FA, #2563EB)"
            }} />

            {/* Success Icon with rings */}
            <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
              {/* Pulsing rings */}
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%", border: "2px solid #2563EB"
              }} className="ring-pulse" />
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%", border: "2px solid #93C5FD"
              }} className="ring-pulse-2" />

              {/* Icon circle */}
              <div className="success-icon" style={{
                width: 100, height: 100, borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 32px rgba(37,99,235,0.35), 0 4px 12px rgba(37,99,235,0.2)"
              }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M12 25l9 9 15-18"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="check-draw"
                  />
                </svg>
              </div>

              {/* Celebration particles */}
              {[
                { bg: "#FCD34D", tx: "-55px", ty: "-45px" },
                { bg: "#34D399", tx: "55px",  ty: "-45px" },
                { bg: "#F87171", tx: "-50px", ty: "40px"  },
                { bg: "#60A5FA", tx: "50px",  ty: "40px"  },
                { bg: "#A78BFA", tx: "0px",   ty: "-65px" },
                { bg: "#FB923C", tx: "-70px", ty: "0px"   },
                { bg: "#2DD4BF", tx: "70px",  ty: "0px"   },
              ].map((s, i) => (
                <div key={i} className="star" style={{
                  background: s.bg,
                  top: "50%", left: "50%",
                  marginTop: -4, marginLeft: -4,
                  "--tx": s.tx, "--ty": s.ty,
                  animationDelay: `${0.5 + i * 0.05}s`
                } as any} />
              ))}
            </div>

            {/* Heading */}
            <h1 className="text-1" style={{
              fontSize: 34, fontWeight: 900, color: "#0F172A",
              margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.1
            }}>
              Access Granted! 🎉
            </h1>

            {/* Subtext */}
            <p className="text-2" style={{
              fontSize: 16, color: "#475569", lineHeight: 1.7,
              margin: "0 0 36px", fontWeight: 500
            }}>
              Thank you for giving your business profile access.<br />
              <strong style={{ color: "#111827", fontWeight: 700 }}>
                Our team will get in touch with you soon.
              </strong>
            </p>

            {/* Info card */}
            <div className="card-body" style={{
              background: "linear-gradient(135deg, #F0F7FF 0%, #EFF6FF 100%)",
              borderRadius: 16,
              border: "1px solid #DBEAFE",
              padding: "20px 24px",
              textAlign: "left",
              marginBottom: 32
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#2563EB"
                }} className="dot-1" />
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#93C5FD"
                }} className="dot-2" />
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#BFDBFE"
                }} className="dot-3" />
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#2563EB",
                  textTransform: "uppercase", letterSpacing: "0.12em", marginLeft: 4
                }}>
                  Configuring Profiles
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.6 }}>
                We're internally setting up your profiles for management. No further action is required — you may safely close this window.
              </p>
            </div>

            {/* Brand footer */}
            <div className="footer-fade" style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8
            }}>
              <Globe size={13} style={{ color: "#94A3B8" }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#94A3B8",
                textTransform: "uppercase", letterSpacing: "0.08em"
              }}>
                Powered by RankVed
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
