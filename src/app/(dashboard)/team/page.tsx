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

  const fetchMembers = async () => {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "TEAM" });
      setShowForm(false);
      fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    await fetch(`/api/team?id=${id}`, { method: "DELETE" });
    fetchMembers();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
        <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">Admin only</h2>
        <p className="text-[13px] text-[var(--text-tertiary)]">You don't have permission to manage team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Team</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Manage who can create and schedule posts.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add member"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4">New team member</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Full name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent" placeholder="john@company.com" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Password</label>
              <input type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent" placeholder="Set a password" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent">
                <option value="TEAM">Team member (posts only)</option>
                <option value="ADMIN">Admin (full access)</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-[var(--border)] mx-auto mb-2" />
            <p className="text-[13px] text-[var(--text-tertiary)]">No team members yet.</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide text-left">
                <th className="px-5 py-2.5 font-medium">Member</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Role</th>
                <th className="px-5 py-2.5 font-medium hidden sm:table-cell">Added</th>
                <th className="px-5 py-2.5 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[12px] font-semibold text-[var(--text-secondary)]">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{m.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      m.role === "ADMIN" ? "text-[var(--accent)] bg-[var(--accent-light)]" : "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]"
                    }`}>{m.role === "ADMIN" ? "Admin" : "Team"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-[var(--text-tertiary)] hidden sm:table-cell">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.role !== "ADMIN" && (
                      <button onClick={() => handleDelete(m.id, m.name)}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-md transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
