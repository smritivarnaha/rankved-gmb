"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ExternalLink, RefreshCw, MapPin, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.role === "ADMIN";
  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success?: string; error?: string } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const handleGoogleConnect = async () => {
    setConnecting(true);
    await signIn("google", { callbackUrl: "/settings" });
  };

  const hasGoogleToken = !!(session as any)?.accessToken;

  // Load saved profiles
  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setProfiles(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingProfiles(false));
  }, []);

  const handleFetchProfiles = async () => {
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch("/api/profiles", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setProfiles(data.data || []);
        setFetchResult({ success: data.message || `${(data.data || []).length} profiles fetched.` });
      } else {
        setFetchResult({ error: data.error || "Failed to fetch profiles." });
      }
    } catch {
      setFetchResult({ error: "Network error. Please try again." });
    }
    setFetching(false);
  };

  return (
    <div className="space-y-6 max-w-[700px]">
      <div>
        <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Account and integration settings.</p>
      </div>

      {/* Account */}
      <div className="bg-white border border-[var(--border)] rounded-lg">
        <div className="px-5 py-4 border-b border-[var(--border-light)]">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Account</h2>
        </div>
        <div className="p-5 space-y-3 text-[13px]">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Name</span>
            <span className="text-[var(--text-primary)] font-medium">{session?.user?.name || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Email</span>
            <span className="text-[var(--text-primary)] font-medium">{session?.user?.email || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Role</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isAdmin ? "text-[var(--accent)] bg-[var(--accent-light)]" : "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]"
            }`}>{isAdmin ? "Admin" : "Team"}</span>
          </div>
        </div>
      </div>

      {/* Google Integration — Admin only */}
      {isAdmin && (
        <div className="bg-white border border-[var(--border)] rounded-lg">
          <div className="px-5 py-4 border-b border-[var(--border-light)]">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Google Business Profile</h2>
          </div>
          <div className="p-5">
            {hasGoogleToken ? (
              <div className="flex items-center gap-3 p-3 bg-[var(--success-bg)] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--success)]">Connected</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Google account is linked and active.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Connect your Google account to manage Business Profiles and publish posts.
                </p>
                <button onClick={handleGoogleConnect} disabled={connecting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors">
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  )}
                  Connect Google account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fetch Profiles — Admin only */}
      {isAdmin && (
        <div className="bg-white border border-[var(--border)] rounded-lg">
          <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Profiles</h2>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                {profiles.length > 0 ? `${profiles.length} profiles saved` : "No profiles fetched yet"}
              </p>
            </div>
            <button onClick={handleFetchProfiles} disabled={fetching || !hasGoogleToken}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors">
              {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {fetching ? "Fetching..." : "Fetch profiles"}
            </button>
          </div>

          <div className="p-5">
            {/* Result message */}
            {fetchResult && (
              <div className={`p-3 rounded-lg mb-4 flex items-start gap-2 ${
                fetchResult.success ? "bg-[var(--success-bg)]" : "bg-[var(--error-bg)]"
              }`}>
                {fetchResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0 mt-0.5" />
                )}
                <p className={`text-[12px] ${fetchResult.success ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                  {fetchResult.success || fetchResult.error}
                </p>
              </div>
            )}

            {!hasGoogleToken && (
              <p className="text-[12px] text-[var(--text-tertiary)]">Connect your Google account first to fetch profiles.</p>
            )}

            {loadingProfiles ? (
              <div className="py-6 flex justify-center"><Loader2 className="w-4 h-4 text-[var(--text-tertiary)] animate-spin" /></div>
            ) : profiles.length > 0 ? (
              <div className="divide-y divide-[var(--border-light)]">
                {profiles.map((p) => (
                  <div key={p.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{p.accountName}</p>
                      {p.address && <p className="text-[11px] text-[var(--text-tertiary)] truncate">{p.address}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {p.phone && <p className="text-[11px] text-[var(--text-secondary)]">{p.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : hasGoogleToken ? (
              <p className="text-[12px] text-[var(--text-tertiary)] py-4 text-center">Click "Fetch profiles" to pull your Google Business Profiles.</p>
            ) : null}
          </div>
        </div>
      )}

      {/* API Info */}
      {isAdmin && (
        <div className="bg-white border border-[var(--border)] rounded-lg">
          <div className="px-5 py-4 border-b border-[var(--border-light)]">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">API Quota</h2>
          </div>
          <div className="p-5 text-[13px] text-[var(--text-secondary)] space-y-2">
            <p>Google Business Profile API requires quota approval for your Cloud project.</p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfME4CQiNAKZPFsnwwlBSLIH-CHtpXBz1daKQbIpqJj63Y-UQ/viewform"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline text-[13px]">
              <ExternalLink className="w-3.5 h-3.5" /> Submit GBP API access request
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
