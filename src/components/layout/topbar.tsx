"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export function Topbar() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // Derive title from pathname, or default to "site"
  let pageTitle = "site";
  if (pathname.includes("/admin")) pageTitle = "Admin Setup";
  else if (pathname.includes("/command-center")) pageTitle = "Command Center";
  else if (pathname.includes("/performance")) pageTitle = "Performance";
  else if (pathname.includes("/profiles")) pageTitle = "Profiles";
  else if (pathname.includes("/calendar")) pageTitle = "Calendar";

  return (
    <header style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #eaeaea", background: "#fff", fontFamily: "Inter, sans-serif" }}>
      {/* ─── Top Row ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 48 }}>
        {/* Left: Project Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 6, marginLeft: -8 }} onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: 20, height: 20, background: "#000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>N</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#000" }}>site</span>
            <ChevronsUpDown size={12} color="#888" />
          </div>
        </div>

        {/* Right: Breadcrumbs & Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
            <span>Deployments</span>
            <span style={{ color: "#eaeaea" }}>/</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }} />
              <span style={{ color: "#000", fontWeight: 500, fontFamily: "monospace" }}>0wA...</span>
            </div>
          </div>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              title={name} 
              style={{ width: 28, height: 28, borderRadius: "50%", background: "#000", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 600, overflow: "hidden" }}
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </button>

            {showMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 50, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #eaeaea" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{name}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>{email}</p>
                </div>
                <div style={{ padding: 4 }}>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/login" })} 
                    style={{ width: "100%", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#DC2626", borderRadius: 4, textAlign: "left" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Tabs ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 24px", height: 48, overflowX: "auto" }}>
        {[
          { id: "deployment", label: "Deployment" },
          { id: "resources", label: "Resources" },
          { id: "source", label: "Source" },
          { id: "open-graph", label: "Open Graph" },
          { id: "bundle-sizes", label: "Bundle Sizes" }
        ].map((tab, idx) => (
          <div 
            key={tab.id}
            style={{ 
              height: "100%", 
              display: "flex", 
              alignItems: "center", 
              fontSize: 14, 
              color: idx === 0 ? "#000" : "#666", 
              fontWeight: idx === 0 ? 500 : 400,
              cursor: "pointer",
              position: "relative",
              borderBottom: idx === 0 ? "2px solid #000" : "2px solid transparent",
              marginTop: "2px"
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </header>
  );
}
