"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FindBusinessSearch } from "@/components/onboarding/FindBusinessSearch";
import { Loader2, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    // Set a cookie or localStorage to remember the searched place ID
    // so we can automatically sync it after redirection
    if (selectedPlace) {
      localStorage.setItem("pendingOnboardPlace", JSON.stringify(selectedPlace));
    }

    // Trigger Google Auth with the required scopes
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Agency Onboarding
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Find Your Business</h1>
          <p className="text-lg text-slate-500 font-semibold max-w-xl mx-auto">
            Connect your Google Business Profile to our marketing dashboard to start analyzing rankings and managing posts.
          </p>
        </div>

        <div className="anim-fade-up">
          <FindBusinessSearch onSelect={setSelectedPlace} />
        </div>

        {selectedPlace && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
            >
              {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Grant Management Access
            </button>
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            Powered by <img src="/rankved-logo.png" alt="Rankved" className="h-4 grayscale opacity-50" />
          </p>
        </div>
      </div>
    </div>
  );
}
