"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
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
        </div>

        <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-6">
          Default: admin@postpulse.io / admin123
        </p>
      </div>
    </div>
  );
}
