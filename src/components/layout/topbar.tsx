"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Search, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Topbar() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header
      style={{
        height: 64,
        borderBottom: "1px solid var(--border-light)",
        background: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: 12,
      }}
    >
      {/* Left: Mobile logo + Search bar */}
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 12 }}>
        {/* Mobile logo */}
        <div className="md:hidden" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/rankved-logo.png" alt="Rankved" width={26} height={26} className="rounded-md" />
          <span style={{ fontFamily: "'Google Sans','Roboto',sans-serif", fontWeight: 500, fontSize: 15, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            RankVed
          </span>
        </div>

        {/* Google-style search — pill shape, grey fill, no border */}
        <div className="hidden sm:block" style={{ position: "relative", width: 300 }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search"
            style={{
              width: "100%",
              background: "var(--bg-secondary)",
              border: "1px solid transparent",
              borderRadius: 24,
              padding: "8px 16px 8px 40px",
              fontSize: 14,
              fontFamily: "'Google Sans','Roboto',sans-serif",
              color: "var(--text-primary)",
              outline: "none",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onFocus={e => {
              (e.target as HTMLInputElement).style.background = "#fff";
              (e.target as HTMLInputElement).style.borderColor = "var(--accent)";
              (e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px var(--accent-glow)";
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.background = "var(--bg-secondary)";
              (e.target as HTMLInputElement).style.borderColor = "transparent";
              (e.target as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Right: Google-style circular avatar with account menu */}
      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          title={name}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={name}
              style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Google Sans','Roboto',sans-serif",
              fontWeight: 500, fontSize: 13, color: "#fff",
              userSelect: "none",
            }}>
              {initials}
            </div>
          )}
          <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)", display: "block" }}
            className={showMenu ? "rotate-180" : ""} />
        </button>

        {showMenu && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            width: 220,
            background: "#fff",
            border: "1px solid var(--border-light)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
            zIndex: 50,
          }}>
            {/* Account info */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-light)" }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", fontFamily: "'Google Sans','Roboto',sans-serif", marginBottom: 2 }}>{name}</p>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{email}</p>
            </div>
            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "12px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, fontFamily: "'Google Sans','Roboto',sans-serif",
                fontWeight: 400, color: "var(--text-secondary)",
                textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-secondary)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
            >
              <LogOut style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
