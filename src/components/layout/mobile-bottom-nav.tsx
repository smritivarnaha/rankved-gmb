"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MapPin, BarChart3, MessageSquare, Settings,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Home",        color: "#2563eb" },
  { href: "/profiles",    icon: MapPin,           label: "Profiles",    color: "#2563eb" },
  { href: "/performance", icon: BarChart3,        label: "Performance", color: "#2563eb" },
  { href: "/reviews",     icon: MessageSquare,    label: "Reviews",     color: "#2563eb" },
  { href: "/settings",    icon: Settings,         label: "Settings",    color: "#2563eb" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);

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
        @keyframes navPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.88); }
          70%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        .nav-item-icon-active {
          animation: navPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .nav-tab {
          transition: color 200ms ease;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .nav-tab:active .nav-pill {
          transform: scale(0.92) !important;
        }
        .nav-pill {
          transition: background 220ms cubic-bezier(0.4, 0, 0.2, 1),
                      transform 160ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-label {
          transition: color 200ms ease, font-weight 150ms ease;
        }
      `}</style>

      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        /* Frosted glass — Zomato/Zepto signature */
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        /* Premium top border gradient instead of flat line */
        borderTop: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 -8px 32px rgba(37, 99, 235, 0.06), 0 -1px 0 rgba(0,0,0,0.04)",
      }}>
        <div style={{
          display: "flex",
          height: 62,
          maxWidth: 520,
          margin: "0 auto",
          padding: "0 4px",
        }}>
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-tab"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0,
                  textDecoration: "none",
                  color: active ? item.color : "#94a3b8",
                  position: "relative",
                  padding: "8px 0 6px",
                }}
              >
                {/* Icon pill bubble — only active */}
                <div
                  className="nav-pill"
                  style={{
                    width: 46,
                    height: 30,
                    borderRadius: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? "rgba(37, 99, 235, 0.1)" : "transparent",
                    marginBottom: 4,
                    position: "relative",
                  }}
                >
                  {/* Top active dot */}
                  {active && (
                    <div style={{
                      position: "absolute",
                      top: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 20,
                      height: 3,
                      borderRadius: "0 0 4px 4px",
                      background: item.color,
                    }} />
                  )}

                  <span className={active ? "nav-item-icon-active" : ""} style={{ display: "flex" }}>
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.7}
                      fill={active ? "rgba(37,99,235,0.12)" : "none"}
                    />
                  </span>
                </div>

                {/* Label */}
                <span
                  className="nav-label"
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: active ? "0.01em" : "0",
                    lineHeight: 1,
                    color: active ? item.color : "#9ca3af",
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
