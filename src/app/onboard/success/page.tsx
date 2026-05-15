"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OnboardSuccessPage() {
  const [syncing, setSyncing] = useState(true);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Trigger sync automatically
    const doSync = async () => {
      try {
        const res = await fetch("/api/profiles", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setCount(data.data?.length || 0);
          setSyncing(false);
        } else {
          setError(data.error || "Failed to sync profiles.");
          setSyncing(false);
        }
      } catch (err) {
        setError("Network error during sync.");
        setSyncing(false);
      }
    };

    doSync();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-[480px] w-full text-center">
        {syncing ? (
          <div className="animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
              <Loader2 className="text-[#2563eb] animate-spin" size={40} />
              <div className="absolute inset-0 border-4 border-[#2563eb]/20 rounded-3xl animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight mb-3">
              Syncing Your Profiles...
            </h1>
            <p className="text-[#64748b] text-[15px] font-medium leading-relaxed">
              We are fetching your Google Business Profiles. This will only take a moment.
            </p>
          </div>
        ) : error ? (
          <div className="animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <div className="text-red-500 font-bold text-4xl">!</div>
            </div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight mb-3">
              Almost Done!
            </h1>
            <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8">
              Your account is connected, but we hit a snag syncing profiles: <br/>
              <span className="text-red-500">{error}</span>
            </p>
            <Link 
              href="/onboard"
              className="inline-flex h-12 px-8 bg-[#0f172a] text-white rounded-xl font-bold items-center justify-center gap-2 hover:bg-[#1e293b] transition-all"
            >
              Try Again
            </Link>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
              <CheckCircle2 className="text-emerald-500" size={48} />
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-3xl animate-ping opacity-20" />
            </div>
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight mb-3">
              Success!
            </h1>
            <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8">
              Successfully connected and fetched <span className="text-[#0f172a] font-bold">{count}</span> profiles. <br/>
              RankVed team can now start managing your posts.
            </p>
            <div className="bg-white rounded-2xl border border-[#f1f5f9] p-6 shadow-sm mb-8 text-left">
              <h4 className="text-xs font-black text-[#94a3b8] uppercase tracking-widest mb-4">What's Next?</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-semibold text-[#334155]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                  Post scheduling is now active
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[#334155]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                  AI optimization is being prepared
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[#334155]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                  You can close this window now
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
