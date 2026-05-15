"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, Settings, MapPin,
  FileText, Users, Shield, BarChart3, Key, Zap,
  Search, ChevronsUpDown, Command, User, Share2, 
  Lock, Star, ArrowRight, LogOut, Database, Globe, Edit3, MessageSquare
} from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

  const navCategories = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Command Center", href: "/command-center", icon: Zap },
        { name: "Performance", href: "/performance", icon: BarChart3 },
        { name: "Profiles", href: "/profiles", icon: MapPin },
        { name: "Prompts", href: "/prompts", icon: FileText, aiOnly: true },
      ]
    },
    {
      label: "GOOGLE OFFICIAL",
      items: [
        { name: "Live Posts Feed", href: "/google-posts", icon: Globe },
        { name: "Edit Profile", href: "/profiles", icon: Edit3 },
        { name: "Reviews", href: "/reviews", icon: MessageSquare },
      ]
    },
    {
      label: "MANAGEMENT",
      items: [
        { name: "Calendar", href: "/calendar", icon: CalendarDays },
        { name: "Team", href: "/team", icon: Users, hideForTeam: true },
        { name: "API Keys", href: "/api-keys", icon: Key, hideForTeam: true },
      ]
    },
    {
      label: "SYSTEM",
      items: [
        { name: "Settings", href: "/settings", icon: Settings },
        { name: "Backup & Restore", href: "/settings/backup", icon: Database, superAdminOnly: true },
        { name: "Admin Setup", href: "/admin", icon: Shield, superAdminOnly: true },
      ]
    }
  ];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useGlobalSettings();
  const aiFeaturesEnabled = settings?.aiFeaturesEnabled ?? false;
  const sidebarText = settings?.sidebarText || "RankVed";
  const sidebarLogoUrl = settings?.sidebarLogoUrl || "https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif";
  const sidebarLogoShape = settings?.sidebarLogoShape || "circle";
  const sidebarLogoSize = settings?.sidebarLogoSize || 24;
  const sidebarTextSize = settings?.sidebarTextSize || 14;

  const user = (session as any)?.user;
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN" || user?.email?.toLowerCase() === "rankved.business@gmail.com";

  return (
    <aside style={{ width: 260, borderRight: "1px solid #eaeaea", background: "#fcfcfc", display: "flex", flexDirection: "column", height: "100vh", padding: "16px 12px", position: "sticky", top: 0, flexShrink: 0 }}>
      {/* ─── Organization Selector ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderRadius: 6, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            width: sidebarLogoSize, 
            height: sidebarLogoSize, 
            background: "transparent", 
            borderRadius: sidebarLogoShape === "circle" ? "50%" : sidebarLogoShape === "rounded" ? "8px" : "0", 
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" 
          }}>
            <img src={sidebarLogoUrl} alt={sidebarText} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: sidebarTextSize, fontWeight: 600, color: "#111" }}>{sidebarText}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: 100 }}>GMB</span>
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

      {/* ─── Navigation Categories ─── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 4px", display: "flex", flexDirection: "column", gap: 24 }}>
        {navCategories.map((cat) => {
          const visibleItems = cat.items.filter((item: any) => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (item.hideForTeam && role !== "AGENCY_OWNER" && !isSuperAdmin) return false;
            if (item.aiOnly && !aiFeaturesEnabled) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.label}>
              {cat.label === "GOOGLE OFFICIAL" ? (
                <div style={{ marginBottom: 8, padding: "10px 12px 6px", background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)", borderRadius: 10, border: "1px solid #dbeafe" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: "linear-gradient(135deg, #4285F4, #34A853)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>G</span>
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", margin: 0 }}>GOOGLE OFFICIAL</p>
                  </div>
                  <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 7, textDecoration: "none", background: isActive ? "#dbeafe" : "transparent", transition: "background 0.15s" }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(37,99,235,0.07)"; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                        >
                          <Icon size={15} strokeWidth={1.5} color={isActive ? "#2563eb" : "#60a5fa"} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#1d4ed8" : "#3b82f6" }}>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.05em", padding: "0 12px", marginBottom: 8 }}>{cat.label}</p>
                  <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link key={item.name} href={item.href}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, textDecoration: "none", background: isActive ? "#eaeaea" : "transparent", transition: "background 0.2s" }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f5f5f5"; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Icon size={16} strokeWidth={1.5} color={isActive ? "#111" : "#666"} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#111" : "#666" }}>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Plan & Collapse ─── */}
      <div style={{ marginTop: "auto", padding: "0 4px" }}>
        <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "16px", marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, background: "#eff6ff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={14} fill="#2563eb" color="#2563eb" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Pro Plan</span>
          </div>
          <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>12 of 50 profiles used</p>
          <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 100, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ width: "24%", height: "100%", background: "#2563eb", borderRadius: 100 }} />
          </div>
          <button style={{ width: "100%", height: 32, background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            Upgrade Plan <ArrowRight size={12} />
          </button>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "transparent", border: "none", color: "#666", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#dc2626"} onMouseLeave={e => e.currentTarget.style.color = "#666"}>
          <LogOut size={16} /> <span style={{ fontSize: 13, fontWeight: 500 }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
