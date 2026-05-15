"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function DirectLinkPage() {
  useEffect(() => {
    // Admin ID for RankVed
    const ADMIN_ID = "cmo33rkyy0000jm04n975frer"; 
    document.cookie = `linkUserId=${ADMIN_ID}; path=/; max-age=3600; samesite=lax`;
    
    // Redirect to Google OAuth immediately
    signIn("google", { callbackUrl: "/onboard/success" });
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-[#2563eb] animate-spin" size={40} />
        <p className="text-[#64748b] font-semibold text-lg animate-pulse">
          Connecting to Google...
        </p>
      </div>
    </div>
  );
}
