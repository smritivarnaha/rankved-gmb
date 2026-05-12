"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

const TABS = ["Deployment", "Resources", "Source", "Open Graph", "Bundle Sizes"];

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56 }}>
        {/* Left: Project Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "6px 8px", borderRadius: 6, marginLeft: -8 }} onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <div style={{ width: 24, height: 24, background: "#111", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>N</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{pageTitle}</span>
          <ChevronsUpDown size={14} color="#888" />
        </div>

        {/* Right: Breadcrumbs + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
            <span>Deployments</span>
            <span style={{ color: "#eaeaea" }}>/</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
              <span style={{ fontFamily: "monospace", color: "#111" }}>0wA...</span>
            </div>
          </div>

          <div style={{ position: "relative" }} ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              title={name} 
              style={{ width: 32, height: 32, borderRadius: "50%", background: "#000", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt={name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
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
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 24px", height: 48 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            style={{
              padding: "6px 12px",
              background: i === 0 ? "#eaeaea" : "transparent",
              color: i === 0 ? "#111" : "#666",
              border: "none", borderRadius: 6,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => { if(i !== 0) e.currentTarget.style.color = "#111"; }}
            onMouseLeave={(e) => { if(i !== 0) e.currentTarget.style.color = "#666"; }}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
}
