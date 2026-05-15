"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LottieWrapper } from "@/components/ui/lottie-wrapper";

export default function OnboardSuccessPage() {
  useEffect(() => {
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
    <div style={{ 
      minHeight: "100vh", background: "#FAFAFA", 
      display: "flex", alignItems: "center", justifyContent: "center", 
      padding: 24, fontFamily: "Inter, sans-serif" 
    }}>
      <div style={{ 
        maxWidth: 480, width: "100%", background: "#FFFFFF", 
        borderRadius: 24, border: "1px solid #EAEAEA", 
        padding: 48, textAlign: "center",
        boxShadow: "0 20px 50px rgba(0,0,0,0.04)"
      }} className="ds-anim-fade">
        
        {/* Success Animation */}
        <div style={{ 
          width: 160, height: 160, margin: "0 auto 16px"
        }}>
          <LottieWrapper url="https://assets3.lottiefiles.com/packages/lf20_yupe0msc.json" />
        </div>

        {/* Congratulatory Text */}
        <h1 style={{ 
          fontSize: 32, fontWeight: 800, color: "#111827", 
          margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.1 
        }}>
          Access Granted!
        </h1>
        
        <p style={{ 
          fontSize: 16, color: "#475569", lineHeight: 1.6, 
          margin: "0 0 40px", fontWeight: 500 
        }}>
          Thank you for giving your business profile access. <br/>
          <span style={{ color: "#111827", fontWeight: 600 }}>Our team will get in touch with you soon.</span>
        </p>

        {/* Internal Process Indicator (Subtle) */}
        <div style={{ 
          background: "#F8FAFC", borderRadius: 16, border: "1px solid #F1F5F9", 
          padding: 24, textAlign: "left" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Automated Onboarding
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
            We are internally configuring your profiles for management. No further action is required on your part. You may close this window.
          </p>
        </div>

        {/* Brand Footer */}
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Globe size={14} style={{ color: "#94A3B8" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            RankVed GBP Manager
          </span>
        </div>
      </div>
    </div>
  );
}
