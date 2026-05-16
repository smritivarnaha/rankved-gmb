"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MapPin, BarChart3, MessageSquare, Settings,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Home" },
  { href: "/profiles",    icon: MapPin,           label: "Profiles" },
  { href: "/performance", icon: BarChart3,        label: "Perf." },
  { href: "/reviews",     icon: MessageSquare,    label: "Reviews" },
  { href: "/settings",    icon: Settings,         label: "Settings" },
];

const BRAND = "#2563eb";
const BRAND_DARK = "#1d4ed8";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setVisible(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes bubblePop {
          0%   { transform: scale(0.82) translateY(6px); opacity: 0.5; }
          60%  { transform: scale(1.10) translateY(-3px); opacity: 1; }
          100% { transform: scale(1)   translateY(-12px); opacity: 1; }
        }
        @keyframes bubbleIdle {
          0%,100% { transform: translateY(-12px); }
        }
        .fnav-bubble {
          animation: bubblePop 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .fnav-bubble-static { transform: translateY(-12px); }
        .fnav-link {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .fnav-link:active .fnav-bubble,
        .fnav-link:active .fnav-bubble-static {
          transform: scale(0.92) translateY(-10px) !important;
        }
        .fnav-link:active .fnav-inactive-icon {
          transform: scale(0.88);
        }
        .fnav-inactive-icon {
          transition: transform 160ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Spacer so page content clears the floating nav */}
      <div style={{ height: 86 }} aria-hidden />

      <nav style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        right: 12,
        zIndex: 300,
        borderRadius: 28,
        background: "#ffffff",
        boxShadow: "0 8px 32px rgba(37,99,235,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid rgba(37,99,235,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        overflow: "visible",
      }}>
        <div style={{
          display: "flex",
          height: 64,
          alignItems: "flex-end",
          padding: "0 4px 0 4px",
          overflow: "visible",
        }}>
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="fnav-link"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 10,
                  textDecoration: "none",
                  position: "relative",
                  overflow: "visible",
                  minHeight: 64,
                }}
              >
                {active ? (
                  /* ── Active: floating filled circle ── */
                  <>
                    <div
                      className="fnav-bubble-static"
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: `linear-gradient(145deg, ${BRAND}, ${BRAND_DARK})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 6px 20px rgba(37,99,235,0.40), 0 2px 6px rgba(37,99,235,0.25)`,
                        marginBottom: 4,
                        flexShrink: 0,
                        transition: "box-shadow 200ms ease",
                      }}
                    >
                      <Icon size={22} color="#ffffff" strokeWidth={2.2} />
                    </div>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: BRAND,
                      letterSpacing: "0.02em",
                      lineHeight: 1,
                    }}>
                      {item.label}
                    </span>
                  </>
                ) : (
                  /* ── Inactive: plain icon + label ── */
                  <>
                    <div
                      className="fnav-inactive-icon"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 2,
                      }}
                    >
                      <Icon size={20} color="#94a3b8" strokeWidth={1.6} />
                    </div>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 500,
                      color: "#94a3b8",
                      lineHeight: 1,
                    }}>
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
