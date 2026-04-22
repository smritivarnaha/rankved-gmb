"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Loader2, Shield, X } from "lucide-react";

export default function TeamPage() {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.role === "ADMIN";
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "TEAM" });

  const fetchMembers = async () => { setLoading(true); const res = await fetch("/api/team"); if (res.ok) { const data = await res.json(); setMembers(data.data || []); } setLoading(false); };
  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ name: "", email: "", password: "", role: "TEAM" }); setShowForm(false); fetchMembers(); } else { const data = await res.json(); alert(data.error); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => { if (!confirm(`Remove ${name} from the team?`)) return; await fetch(`/api/team?id=${id}`, { method: "DELETE" }); fetchMembers(); };

  if (!isAdmin) {
    return (
      <div className="empty-state" style={{ padding: "80px 24px" }}>
        <div className="empty-icon"><Shield style={{ width: 28, height: 28 }} /></div>
        <h3 className="empty-title">Admin only</h3>
        <p className="empty-text">You don&apos;t have permission to manage team members.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage who can create and schedule posts.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          {showForm ? <X style={{ width: 16, height: 16 }} /> : <Plus style={{ width: 16, height: 16 }} />}
          {showForm ? "Cancel" : "Add member"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New team member</h3>
          <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="label">Full name</label>
              <input className="input" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ background: "var(--bg-card)" }}>
                <option value="TEAM">Team member (posts only)</option>
                <option value="ADMIN">Admin (full access)</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                {saving ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />} Add member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px 0", display: "flex", justifyContent: "center" }}><Loader2 className="anim-spin" style={{ width: 20, height: 20, color: "var(--text-muted)" }} /></div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users style={{ width: 28, height: 28 }} /></div>
            <p className="empty-text">No team members yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Added</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{m.email}</td>
                    <td><span className={`badge ${m.role === "ADMIN" ? "badge-info" : "badge-default"}`}>{m.role === "ADMIN" ? "Admin" : "Team"}</span></td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      {m.role !== "ADMIN" && (
                        <button onClick={() => handleDelete(m.id, m.name)} style={{ padding: 6, borderRadius: "var(--radius-sm)", color: "var(--text-muted)", transition: "all 0.12s" }}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
