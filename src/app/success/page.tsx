"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, BarChart3, CalendarDays, Star } from "lucide-react";
import Image from "next/image";

export default function SuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);

  // Auto-redirect to dashboard after 8s if they're already signed in
  useEffect(() => {
    if (status === "loading") return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); router.push("/"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status, router]);

  const isLoggedIn = status === "authenticated";

  return (
    <div style={{
      minHeight: "100vh", background: "#FAFAFA",
      fontFamily: "Inter, -apple-system, sans-serif",
      display: "flex", flexDirection: "column"
    }}>
      {/* Nav */}
      <nav style={{ padding: "24px 48px", display: "flex", justifyContent: "center", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, background: "#000", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image
              src="https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
              alt="RankVed" width={16} height={16} style={{ filter: "invert(1)" }}
            />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>RANKVED</span>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>

          {/* Success icon */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "#ECFDF5", border: "2px solid #6EE7B7",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px"
          }}>
            <CheckCircle2 size={40} color="#10B981" />
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#EFF6FF", color: "#2563EB", borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            <Sparkles size={12} />
            Authorization Complete
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.2 }}>
            You&apos;re connected!
          </h1>
          <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.6, marginBottom: 40 }}>
            {isLoggedIn
              ? `Welcome, ${session?.user?.name}. Your Google Business Profile is now connected to RankVed GMB Manager.`
              : "Your Google Business Profile has been successfully connected to RankVed GMB Manager."}
          </p>

          {/* What happens next */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "28px 32px", marginBottom: 32, textAlign: "left" }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 20 }}>What happens next</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: BarChart3, color: "#2563EB", bg: "#EFF6FF", title: "Performance tracking activated", desc: "Your GBP metrics will appear in the Performance Hub." },
                { icon: CalendarDays, color: "#10B981", bg: "#ECFDF5", title: "Post scheduling enabled", desc: "Schedule and publish posts to your Google Business Profile." },
                { icon: Star, color: "#F59E0B", bg: "#FFFBEB", title: "Review management ready", desc: "Monitor and respond to reviews from your dashboard." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{title}</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {isLoggedIn ? (
            <div>
              <button
                onClick={() => router.push("/")}
                style={{
                  height: 48, padding: "0 28px", background: "#2563EB", color: "#fff",
                  borderRadius: 10, fontWeight: 600, fontSize: 14, border: "none",
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 12px rgba(37,99,235,0.25)"
                }}
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
              <p style={{ marginTop: 14, fontSize: 12, color: "#9CA3AF" }}>
                Auto-redirecting in {countdown}s…
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Loader2 size={20} style={{ color: "#2563EB" }} className="anim-spin" />
              <p style={{ fontSize: 13, color: "#6B7280" }}>
                The agency owner has been notified. You can close this window.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#D1D5DB", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Trusted by 500+ Local Agencies & Businesses
        </p>
      </footer>
    </div>
  );
}
