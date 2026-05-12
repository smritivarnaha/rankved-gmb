"use client";

import { useState, useEffect } from "react";
import {
  Shield, Users, Database, FileText, Search, Trash2, X,
  Image as ImageIcon, Upload, Save, CheckCircle, Settings,
  Eye, EyeOff, UserPlus, Filter, Sparkles, ChevronDown
} from "lucide-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/* ─── Shared Inline Styles ─── */
const cardStyle = {
  background: "#fff", border: "1px solid #eaeaea",
  borderRadius: 8, padding: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
};
const inputStyle = {
  width: "100%", height: 38, padding: "0 12px",
  background: "#fff", border: "1px solid #eaeaea",
  borderRadius: 6, fontSize: 14, color: "#111827",
  outline: "none", transition: "border-color 0.15s"
};
const btnPrimary = {
  height: 38, padding: "0 16px", background: "#2563EB",
  color: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 500,
  border: "none", cursor: "pointer", display: "flex",
  alignItems: "center", gap: 8, transition: "background 0.2s"
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const userRole = (session as any)?.user?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const { data, mutate } = useSWR("/api/admin/users", fetcher);
  const users = data?.data || [];
  const stats = data?.stats || { totalUsers: 0, totalProfiles: 0, totalPosts: 0 };

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const [loginSettings, setLoginSettings] = useState({
    loginBgUrl: "", loginHeading: "", loginDescription: "",
    loginBgOpacity: 0.2, aiFeaturesEnabled: true,
    sidebarText: "RankVed", sidebarLogoUrl: "https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
  });
  const [selectedBg, setSelectedBg] = useState<File | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login-settings")
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) setLoginSettings(d);
      });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const formData = new FormData();
      formData.append("heading", loginSettings.loginHeading);
      formData.append("description", loginSettings.loginDescription);
      formData.append("opacity", loginSettings.loginBgOpacity.toString());
      formData.append("aiFeaturesEnabled", loginSettings.aiFeaturesEnabled.toString());
      formData.append("sidebarText", loginSettings.sidebarText);
      if (selectedBg) formData.append("image", selectedBg);
      if (selectedLogo) formData.append("sidebarLogo", selectedLogo);

      const res = await fetch("/api/admin/login-settings", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to save");
      const d = await res.json();
      setLoginSettings(d.settings);
      setSelectedBg(null);
      setSelectedLogo(null);
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName, username: newUserUsername,
          email: newUserEmail, password: newUserPassword
        }),
      });
      if (!res.ok) throw new Error("Failed to create user");
      mutate();
      setShowCreateModal(false);
    } catch (err: any) { alert(err.message); }
    finally { setCreatingUser(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    mutate({ ...data, data: users.filter((u: any) => u.id !== id) }, false);
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      mutate();
    } catch (err) { mutate(); }
  };

  const filteredUsers = users.filter((u: any) =>
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={24} color="#2563EB" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Admin Dashboard</h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Platform overview and user management</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>
          <UserPlus size={16} /> Create New Agency Owner
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Total Users", val: stats.totalUsers, icon: Users, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Total Profiles Connected", val: stats.totalProfiles, icon: Database, color: "#10B981", bg: "#ECFDF5" },
          { label: "Total Posts", val: stats.totalPosts, icon: FileText, color: "#8B5CF6", bg: "#F5F3FF" }
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500, margin: "0 0 4px" }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Users Table ─── */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Users</h3>
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between" }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: "#94A3B8" }} />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
            <button style={{ ...inputStyle, width: "auto", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#64748B" }}>
              <Filter size={14} color="#2563EB" /> All Roles <ChevronDown size={14} />
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                {["USER", "USERNAME", "ROLE", "JOINED", "ACTIONS"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f8f9fa" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}>
                        {u.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#374151" }}>{u.username}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "4px 8px", background: u.role === "SUPER_ADMIN" ? "#ECFDF5" : "#EFF6FF", color: u.role === "SUPER_ADMIN" ? "#059669" : "#2563EB", borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {u.role !== "SUPER_ADMIN" && (
                      <button onClick={() => handleDelete(u.id, u.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Global Settings ─── */}
      {isSuperAdmin && (
        <div style={{ ...cardStyle, padding: 0 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Settings size={18} color="#64748B" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Global System Settings</h2>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", background: "#F1F5F9", padding: "4px 8px", borderRadius: 100, letterSpacing: "0.05em" }}>SUPER ADMIN ONLY</span>
          </div>
          
          <form onSubmit={handleSaveSettings} style={{ padding: 24 }}>
            {/* Sidebar Branding */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Sidebar Branding</p>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ width: 140, height: 140, background: "#f8f9fa", borderRadius: 8, border: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {selectedLogo ? (
                    <img src={URL.createObjectURL(selectedLogo)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : loginSettings.sidebarLogoUrl ? (
                    <img src={loginSettings.sidebarLogoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <ImageIcon size={32} color="#CBD5E1" />
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <label style={{ ...btnPrimary, background: "#fff", color: "#2563EB", border: "1px solid #BFDBFE" }}>
                      <Upload size={14} /> Upload New Logo
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setSelectedLogo(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Sidebar Text</label>
                    <input type="text" style={inputStyle} value={loginSettings.sidebarText} onChange={e => setLoginSettings({...loginSettings, sidebarText: e.target.value})} placeholder="e.g. RankVed" />
                    <p style={{ fontSize: 11, color: "#64748B", marginTop: 8 }}>The text that appears next to the logo in the sidebar.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Login branding */}
            <div style={{ marginBottom: 32, paddingTop: 24, borderTop: "1px solid #eaeaea" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Login Page Background</p>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ width: 280, height: 140, background: "#f8f9fa", borderRadius: 8, border: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {selectedBg ? (
                    <img src={URL.createObjectURL(selectedBg)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : loginSettings.loginBgUrl ? (
                    <img src={loginSettings.loginBgUrl} alt="Bg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageIcon size={32} color="#CBD5E1" />
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <label style={{ ...btnPrimary, background: "#fff", color: "#2563EB", border: "1px solid #BFDBFE" }}>
                      <Upload size={14} /> Upload New Image
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setSelectedBg(e.target.files?.[0] || null)} />
                    </label>
                    <button type="button" onClick={() => { setSelectedBg(null); setLoginSettings({...loginSettings, loginBgUrl: "/login-bg.jpg"}); }} style={{ ...btnPrimary, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}><Trash2 size={14} /> Remove Image</button>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>RESET TO DEFAULT</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>RECOMMENDED: 1920X1080px · HIGH QUALITY JPG/PNG</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Overlay Darkness</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{Math.round(loginSettings.loginBgOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={loginSettings.loginBgOpacity} onChange={e => setLoginSettings({...loginSettings, loginBgOpacity: parseFloat(e.target.value)})} style={{ width: "100%", accentColor: "#A855F7" }} />
                    <p style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Adjust to ensure text is readable against your background image.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Login Heading</label>
                <input type="text" style={inputStyle} value={loginSettings.loginHeading} onChange={e => setLoginSettings({...loginSettings, loginHeading: e.target.value})} placeholder="Your Google Business, Managed in One Place." />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Login Description</label>
                <textarea style={{ ...inputStyle, height: 80, paddingTop: 10, resize: "none" }} value={loginSettings.loginDescription} onChange={e => setLoginSettings({...loginSettings, loginDescription: e.target.value})} placeholder="Connect your Google account and manage all your business profiles from a single dashboard." />
              </div>
            </div>

            {/* AI Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 24, borderBottom: "1px solid #eaeaea", marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Enable AI Features</p>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Globally enable or disable all AI tools (generation, training) across the platform.</p>
              </div>
              <label style={{ width: 36, height: 20, background: loginSettings.aiFeaturesEnabled ? "#2563EB" : "#CBD5E1", borderRadius: 100, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                <input type="checkbox" style={{ display: "none" }} checked={loginSettings.aiFeaturesEnabled} onChange={e => setLoginSettings({...loginSettings, aiFeaturesEnabled: e.target.checked})} />
                <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", left: loginSettings.aiFeaturesEnabled ? 18 : 2, top: 2, transition: "left 0.2s" }} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={savingSettings} style={{ ...btnPrimary, opacity: savingSettings ? 0.7 : 1 }}>
                <Save size={16} /> {savingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
