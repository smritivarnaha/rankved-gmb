"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, BarChart3, MessageSquare, Settings } from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Home" },
  { href: "/profiles",    icon: MapPin,           label: "Profiles" },
  { href: "/performance", icon: BarChart3,        label: "Performance" },
  { href: "/reviews",     icon: MessageSquare,    label: "Reviews" },
  { href: "/settings",    icon: Settings,         label: "Settings" },
];

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
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#ffffff", borderTop: "1px solid #e5e7eb",
      zIndex: 200, paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", height: 56 }}>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 2, textDecoration: "none",
              color: active ? "#2563eb" : "#9ca3af",
              fontSize: 9, fontWeight: active ? 700 : 500,
              position: "relative",
              transition: "color 150ms",
            }}>
              {active && (
                <div style={{
                  position: "absolute", top: 0, width: 28, height: 2,
                  background: "#2563eb", borderRadius: "0 0 3px 3px",
                }} />
              )}
              <div style={{
                width: 36, height: 24, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "#eff6ff" : "transparent",
              }}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
