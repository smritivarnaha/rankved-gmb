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
          {/* Google Sign In */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 border border-[var(--border)] rounded-lg py-2.5 px-4 text-[14px] font-medium text-[var(--text-primary)] hover:bg-gray-50 transition-colors mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.85v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.59l2.66-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9l2.87 2.07C4.14 4.98 6.23 3.58 8.98 3.58z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] text-[var(--text-tertiary)]">or sign in with email</span>
            </div>
          </div>

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
