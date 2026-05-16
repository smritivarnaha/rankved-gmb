"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, BarChart3, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Home" },
  { href: "/profiles",    icon: MapPin,           label: "Profiles" },
  { href: "/performance", icon: BarChart3,        label: "Performance" },
  { href: "/reviews",     icon: MessageSquare,    label: "Reviews" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Only show on mobile — read from window width to avoid SSR mismatch
  useEffect(() => {
    const check = () => setVisible(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!visible) return null;

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "#ffffff",
      borderTop: "1px solid #e5e7eb",
      zIndex: 200,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        display: "flex",
        height: 58,
        maxWidth: 480,
        margin: "0 auto",
      }}>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? "#2563eb" : "#6b7280",
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.01em",
                transition: "color 150ms ease",
                position: "relative",
              }}
            >
              {/* Active indicator pill */}
              {active && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  width: 32,
                  height: 3,
                  background: "#2563eb",
                  borderRadius: "0 0 4px 4px",
                }} />
              )}
              <div style={{
                width: 40,
                height: 28,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: active ? "#eff6ff" : "transparent",
                transition: "background 150ms ease",
              }}>
                <Icon size={19} strokeWidth={active ? 2.2 : 1.6} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
