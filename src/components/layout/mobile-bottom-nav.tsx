"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Building2, TrendingUp, Star, SlidersHorizontal,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",   icon: Home,              label: "Home"      },
  { href: "/profiles",    icon: Building2,         label: "Profiles"  },
  { href: "/performance", icon: TrendingUp,        label: "Analytics" },
  { href: "/reviews",     icon: Star,              label: "Reviews"   },
  { href: "/settings",    icon: SlidersHorizontal, label: "Settings"  },
];

const BRAND = "#2563eb";

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
        .fnav-tab {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: transform 120ms ease;
        }
        .fnav-tab:active {
          transform: scale(0.92);
        }
        .fnav-pill-bg {
          transition: background 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Page bottom spacer */}
      <div style={{ height: 88 }} aria-hidden />

      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          right: 12,
          zIndex: 300,
          borderRadius: 24,
          background: "#ffffff",
          boxShadow:
            "0 4px 6px rgba(0,0,0,0.04), 0 10px 30px rgba(37,99,235,0.12), 0 1px 0 rgba(0,0,0,0.04)",
          border: "1px solid rgba(37,99,235,0.10)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex",
          height: 64,
          alignItems: "center",
        }}>
          {NAV.map(item => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="fnav-tab"
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  textDecoration: "none",
                  padding: "0 4px",
                  height: "100%",
                }}
              >
                {/* Icon container */}
                <div
                  className="fnav-pill-bg"
                  style={{
                    width: 44,
                    height: 32,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? `rgba(37,99,235,0.12)` : "transparent",
                  }}
                >
                  <Icon
                    size={21}
                    color={active ? BRAND : "#475569"}
                    strokeWidth={active ? 2.4 : 1.8}
                    fill={active && item.href === "/reviews"
                      ? "rgba(37,99,235,0.25)"
                      : "none"
                    }
                  />
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? BRAND : "#475569",
                    lineHeight: 1,
                    fontFamily: "Inter, -apple-system, sans-serif",
                    letterSpacing: active ? "0.01em" : "0",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
