"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, Settings, MapPin,
  FileText, Users, Shield, BarChart3, Key, Zap,
  Search, ChevronsUpDown, Command
} from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

const adminNav = [
  { name: "Overview",   href: "/dashboard",   icon: LayoutDashboard },
  { name: "Deployments", href: "/command-center", icon: Zap },
  { name: "Analytics", href: "/performance", icon: BarChart3 },
  { name: "Profiles",    href: "/profiles",    icon: MapPin },
  { name: "Calendar",    href: "/calendar",    icon: CalendarDays },
  { name: "Prompts",     href: "/prompts",     icon: FileText },
  { name: "Team",        href: "/team",        icon: Users },
  { name: "API Keys",    href: "/api-keys",    icon: Key },
  { name: "Settings",    href: "/settings",    icon: Settings },
];

const superAdminNav = [
  ...adminNav,
  { name: "Admin Setup", href: "/admin", icon: Shield },
];

const teamNav = [
  { name: "Overview",   href: "/dashboard",   icon: LayoutDashboard },
  { name: "Analytics", href: "/performance", icon: BarChart3 },
  { name: "Profiles",    href: "/profiles",    icon: MapPin },
  { name: "Calendar",    href: "/calendar",    icon: CalendarDays },
  { name: "Prompts",     href: "/prompts",     icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useGlobalSettings();
  const aiFeaturesEnabled = settings?.aiFeaturesEnabled ?? false;

  const user = (session as any)?.user;
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN" || user?.email?.toLowerCase() === "rankved.business@gmail.com";
  
  let navItems =
    isSuperAdmin ? superAdminNav :
    role === "AGENCY_OWNER" ? adminNav :
    teamNav;

  if (!aiFeaturesEnabled) {
    navItems = navItems.filter(item => item.name !== "Prompts");
  }

  return (
    <aside style={{ width: 260, borderRight: "1px solid #eaeaea", background: "#fcfcfc", display: "flex", flexDirection: "column", height: "100vh", padding: "16px 12px" }}>
      {/* ─── Organization Selector ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderRadius: 6, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 24, height: 24, background: "#111", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, color: "white" }}>
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Acme</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: 100 }}>Pro</span>
          </div>
        </div>
        <ChevronsUpDown size={14} color="#888" />
      </div>

      {/* ─── Search Bar ─── */}
      <div style={{ position: "relative", marginBottom: 24, padding: "0 4px" }}>
        <Search size={14} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#888" }} />
        <input 
          type="text" 
          placeholder="Find..." 
          style={{ width: "100%", height: 36, padding: "0 32px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 13, outline: "none", color: "#111" }}
        />
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: "1px solid #eaeaea", borderRadius: 4, background: "#fafafa" }}>
          <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>F</span>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 4px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 6, textDecoration: "none",
                background: isActive ? "#eaeaea" : "transparent", transition: "background 0.2s"
              }}
              onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.background = "#f5f5f5"; }}
              onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Icon size={16} strokeWidth={1.5} color={isActive ? "#111" : "#666"} />
                <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#111" : "#666" }}>{item.name}</span>
              </div>
              {/* Fake > chevron for some items like Logs/Observability */}
              {["Logs", "Observability", "Firewall"].includes(item.name) && (
                <span style={{ fontSize: 12, color: "#888" }}>›</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
