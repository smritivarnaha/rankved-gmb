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
import { useMobileLayout } from "@/components/layout/mobile-layout";
import { X } from "lucide-react";

  const navCategories = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Command Center", href: "/command-center", icon: Zap },
        { name: "Performance", href: "/performance", icon: BarChart3 },
        { name: "Profiles", href: "/profiles", icon: MapPin },
        { name: "Rank Tracker", href: "/rank-tracker", icon: Globe, superAdminOnly: true },
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
      label: "SOCIAL MEDIA (SMM)",
      items: [
        { name: "SMM Dashboard", href: "/smm", icon: LayoutDashboard },
        { name: "Clients", href: "/smm/clients", icon: Users },
        { name: "Connections", href: "/smm/connections", icon: Share2 },
        { name: "Composer", href: "/smm/composer", icon: Edit3 },
        { name: "Calendar", href: "/smm/calendar", icon: CalendarDays },
        { name: "Media Library", href: "/smm/media", icon: Database },
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

  const { mobileOpen, closeMobile } = useMobileLayout();
  const user = (session as any)?.user;
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN" || 
                       user?.email?.toLowerCase() === "rankved.business@gmail.com" ||
                       user?.email?.toLowerCase() === "praveen261119@gmail.com";

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 198, backdropFilter: "blur(2px)" }}
          className="mobile-overlay"
        />
      )}
      <aside className={mobileOpen ? "sidebar-drawer sidebar-drawer-open" : "sidebar-drawer"} style={{ width: 260, borderRight: "1px solid #eaeaea", background: "#fcfcfc", display: "flex", flexDirection: "column", height: "100vh", padding: "16px 12px", position: "sticky", top: 0, flexShrink: 0 }}>
      {/* ─── Organization Selector ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderRadius: 6, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: sidebarLogoSize, height: sidebarLogoSize, background: "transparent", borderRadius: sidebarLogoShape === "circle" ? "50%" : sidebarLogoShape === "rounded" ? "8px" : "0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src={sidebarLogoUrl} alt={sidebarText} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: sidebarTextSize, fontWeight: 600, color: "#111" }}>{sidebarText}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: 100 }}>GMB</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronsUpDown size={14} color="#888" />
          {/* Close button — mobile only */}
          <button onClick={closeMobile} className="mobile-sidebar-close" style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#666" }}>
            <X size={18} />
          </button>
        </div>
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
                <div style={{ marginBottom: 8, padding: "12px", background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <svg viewBox="0 0 24 24" width="15" height="15" style={{ flexShrink: 0 }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#1a73e8", letterSpacing: "0.06em", margin: 0, textTransform: "uppercase" }}>GOOGLE OFFICIAL</p>
                  </div>
                  <nav style={{ display: "flex", flexDirection: "column" }}>
                    {visibleItems.map((item, idx) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <div key={item.name}>
                          {idx > 0 && <div style={{ height: 1, background: "#f1f5f9", margin: "4px 4px" }} />}
                          <Link href={item.href}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 7, textDecoration: "none", background: isActive ? "#e8f0fe" : "transparent", transition: "background 0.15s" }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f1f3f4"; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            <Icon size={15} strokeWidth={1.5} color={isActive ? "#1a73e8" : "#5f6368"} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#1a73e8" : "#3c4043" }}>{item.name}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </nav>
                </div>
              ) : cat.label === "SOCIAL MEDIA (SMM)" ? (
                <div style={{ marginBottom: 8, padding: "12px", background: "#ffffff", borderRadius: 10, border: "1px solid #e9d5ff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#7e22ce", letterSpacing: "0.06em", margin: 0, textTransform: "uppercase" }}>SOCIAL MEDIA (SMM)</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {/* FB */}
                      <svg viewBox="0 0 24 24" width="11" height="11" style={{ flexShrink: 0 }}>
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      {/* IG */}
                      <svg viewBox="0 0 24 24" width="11" height="11" style={{ flexShrink: 0 }}>
                        <radialGradient id="ig-grad-sidebar" cx="30%" cy="107%" r="130%">
                          <stop offset="0" stopColor="#fdf497" />
                          <stop offset="0.05" stopColor="#fdf497" />
                          <stop offset="0.45" stopColor="#fd5949" />
                          <stop offset="0.6" stopColor="#d6249f" />
                          <stop offset="0.9" stopColor="#285AEB" />
                        </radialGradient>
                        <path fill="url(#ig-grad-sidebar)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                      {/* LI */}
                      <svg viewBox="0 0 24 24" width="11" height="11" style={{ flexShrink: 0 }}>
                        <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                  </div>
                  <nav style={{ display: "flex", flexDirection: "column" }}>
                    {visibleItems.map((item, idx) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <div key={item.name}>
                          {idx > 0 && <div style={{ height: 1, background: "#f3e8ff", margin: "4px 4px" }} />}
                          <Link href={item.href}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 7, textDecoration: "none", background: isActive ? "#f3e8ff" : "transparent", transition: "background 0.15s" }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(168,85,247,0.05)"; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            <Icon size={15} strokeWidth={1.5} color={isActive ? "#7e22ce" : "#a855f7"} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#6b21a8" : "#7e22ce" }}>{item.name}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </nav>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.05em", padding: "0 12px", marginBottom: 8 }}>{cat.label}</p>
                  <nav style={{ display: "flex", flexDirection: "column" }}>
                    {visibleItems.map((item, idx) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <div key={item.name}>
                          {idx > 0 && <div style={{ height: 1, background: "#f1f5f9", margin: "4px 6px" }} />}
                          <Link href={item.href}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, textDecoration: "none", background: isActive ? "#eaeaea" : "transparent", transition: "background 0.2s" }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f5f5f5"; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <Icon size={16} strokeWidth={1.5} color={isActive ? "#111" : "#666"} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#111" : "#666" }}>{item.name}</span>
                            </div>
                          </Link>
                        </div>
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
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "transparent", border: "none", color: "#666", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#dc2626"} onMouseLeave={e => e.currentTarget.style.color = "#666"}>
          <LogOut size={16} /> <span style={{ fontSize: 13, fontWeight: 500 }}>Sign out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
