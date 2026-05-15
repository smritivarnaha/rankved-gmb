"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { LottieWrapper } from "@/components/ui/lottie-wrapper";

export default function DirectLinkPage() {
  useEffect(() => {
    // Admin ID for RankVed
    const ADMIN_ID = "cmo33rkyy0000jm04n975frer"; 
    document.cookie = `linkUserId=${ADMIN_ID}; path=/; max-age=3600; samesite=lax`;
    
    // Redirect to Google OAuth immediately
    signIn("google", { callbackUrl: "/onboard/success" });
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", background: "#fcfcfc", 
      display: "flex", alignItems: "center", justifyContent: "center", 
      padding: 24, fontFamily: "Inter, sans-serif" 
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }} className="ds-anim-fade">
        <div style={{ width: 200, height: 200, margin: "0 auto 32px" }}>
          <LottieWrapper url="https://assets10.lottiefiles.com/packages/lf20_unp7v8.json" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Connecting to Google
        </h2>
        <p style={{ fontSize: 16, color: "#64748b", margin: 0, fontWeight: 500 }}>
          Authenticating your profile for high-transparency management...
        </p>
      </div>
    </div>
  );
}
