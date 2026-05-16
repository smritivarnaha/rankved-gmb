"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, CalendarDays, MessageSquare, Settings, Menu } from "lucide-react";

const NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Home" },
  { href: "/profiles",   icon: MapPin,           label: "Profiles" },
  { href: "/calendar",   icon: CalendarDays,     label: "Calendar" },
  { href: "/reviews",    icon: MessageSquare,    label: "Reviews" },
  { href: "/settings",   icon: Settings,         label: "Settings" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav style={{
      display: "none",
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#fff", borderTop: "1px solid #eaeaea",
      zIndex: 200, paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }} className="mobile-bottom-nav">
      <div style={{ display: "flex", height: 60 }}>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, textDecoration: "none",
              color: active ? "#2563eb" : "#9ca3af", fontSize: 10, fontWeight: active ? 700 : 500,
              transition: "color 150ms ease",
            }}>
              <div style={{
                width: 44, height: 26, borderRadius: 14, display: "flex", alignItems: "center",
                justifyContent: "center", background: active ? "#eff6ff" : "transparent",
                transition: "background 150ms ease",
              }}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
