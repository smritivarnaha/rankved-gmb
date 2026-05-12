"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, Settings, MapPin,
  FileText, Users, Shield, BarChart3, Key, Zap,
  Search, ChevronsUpDown, Command, User, Share2, 
  Lock, Star, ArrowRight, LogOut
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
    <aside style={{ width: 256, borderRight: "1px solid #eaeaea", background: "#ffffff", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ─── Organization Selector (Vercel Style) ─── */}
      <div style={{ padding: "16px 12px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderRadius: 8, background: "transparent", border: "1px solid transparent" }} onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              background: "#000", 
              borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" 
            }}>
               <img src={sidebarLogoUrl} alt={sidebarText} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "invert(1)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#000", letterSpacing: "-0.01em" }}>{sidebarText}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#2563EB", background: "#EFF6FF", padding: "1px 6px", borderRadius: 100 }}>Pro</span>
            </div>
          </div>
          <ChevronsUpDown size={14} color="#666" />
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div style={{ padding: "0 12px", marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          <input 
            type="text" 
            placeholder="Find..." 
            style={{ width: "100%", height: 34, padding: "0 34px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 13, outline: "none", color: "#000", transition: "border-color 0.2s" }}
            onFocus={e => e.currentTarget.style.borderColor = "#000"}
            onBlur={e => e.currentTarget.style.borderColor = "#eaeaea"}
          />
          <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: "1px solid #eaeaea", borderRadius: 4, background: "#fafafa" }}>
            <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>F</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Categories ─── */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 12px", display: "flex", flexDirection: "column", gap: 32 }}>
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 0px;
          }
          .custom-scrollbar:hover::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #eaeaea;
            border-radius: 10px;
          }
        `}</style>
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
              <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: 6, textDecoration: "none",
                        background: isActive ? "#f0f0f0" : "transparent", transition: "all 0.15s ease",
                        color: isActive ? "#000" : "#666"
                      }}
                      onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.background = "#f5f5f5"; }}
                      onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={16} strokeWidth={isActive ? 2 : 1.5} color={isActive ? "#000" : "#666"} />
                        <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400 }}>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* ─── Footer ─── */}
      <div style={{ padding: "12px", borderTop: "1px solid #f0f0f0" }}>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "transparent", border: "none", color: "#666", cursor: "pointer", borderRadius: 6, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#666"; }}>
          <LogOut size={16} /> <span style={{ fontSize: 13, fontWeight: 400 }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
