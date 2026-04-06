"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Rankved" width={56} height={56} className="mx-auto mb-4 rounded-xl" />
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] mb-1">Rankved GMB Manager</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-[13px] text-[var(--error)] bg-[var(--error-bg)] rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Policy Links */}
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <p className="text-center text-[11px] text-[var(--text-tertiary)] leading-relaxed">
              By signing in, you agree to our{" "}
              <Link href="/terms-of-service" className="text-[var(--accent)] hover:underline font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-[var(--accent)] hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Footer with policy links and security badge */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Your data is secured &amp; encrypted</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[11px] text-[var(--text-tertiary)]">
            <Link href="/privacy-policy" className="hover:text-[var(--text-secondary)] transition-colors hover:underline">
              Privacy Policy
            </Link>
            <span className="text-[var(--border)]">•</span>
            <Link href="/terms-of-service" className="hover:text-[var(--text-secondary)] transition-colors hover:underline">
              Terms of Service
            </Link>
          </div>
          <p className="text-center text-[10px] text-[var(--text-tertiary)] opacity-70">
            © {new Date().getFullYear()} Rankved. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
