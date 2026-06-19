"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useActiveClient } from "@/hooks/useActiveClient";
import { 
  Plus, Search, Building2, User, Mail, Phone, 
  Edit, Trash2, Users, Check, Briefcase, ExternalLink, X, Loader2
} from "lucide-react";

export default function SmmClientsPage() {
  const { data: session } = useSession();
  const currentUser = (session as any)?.user;
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "AGENCY_OWNER";
  const isManager = currentUser?.role === "MANAGER";
  const canEdit = isAdmin || isManager;

  const { activeClient, selectClient } = useActiveClient();
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    businessClinicName: "",
    contactPerson: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    description: "",
    website: "",
    logo: "",
    assignedUserIds: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/smm/clients");
      const data = await res.json();
      if (data.data) {
        setClients(data.data);
      }
    } catch (e) {
      console.error("Error fetching clients:", e);
    }
  };

  const fetchTeam = async () => {
    if (!isAdmin) return; // Only admins can fetch full team lists
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.data) {
        setTeamMembers(data.data);
      }
    } catch (e) {
      console.error("Error fetching team:", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchClients(), fetchTeam()]).finally(() => setLoading(false));
  }, [currentUser]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setForm({
      name: "",
      businessClinicName: "",
      contactPerson: "",
      email: "",
      phone: "",
      status: "ACTIVE",
      description: "",
      website: "",
      logo: "",
      assignedUserIds: []
    });
    setError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setForm({
      name: client.name || "",
      businessClinicName: client.businessClinicName || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status || "ACTIVE",
      description: client.description || "",
      website: client.website || "",
      logo: client.logo || "",
      assignedUserIds: client.smmAssignedUsers?.map((u: any) => u.id) || []
    });
    setError("");
    setModalOpen(true);
  };

  const handleToggleTeamMember = (userId: string) => {
    setForm(prev => {
      const ids = prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter(id => id !== userId)
        : [...prev.assignedUserIds, userId];
      return { ...prev, assignedUserIds: ids };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Client Name is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const url = editingClient ? `/api/smm/clients/${editingClient.id}` : "/api/smm/clients";
      const method = editingClient ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        await fetchClients();
        // If we updated the currently active client, sync the updated activeClient state
        if (editingClient && activeClient && activeClient.id === editingClient.id) {
          selectClient(data.data);
        }
        setModalOpen(false);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client? This will remove all associated SMM social accounts, posts, calendar schedules, and media libraries.")) return;
    try {
      const res = await fetch(`/api/smm/clients/${clientId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        if (activeClient?.id === clientId) {
          selectClient(null);
        }
        fetchClients();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete client");
    }
  };

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.businessClinicName && c.businessClinicName.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Clients & Workspaces</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Manage client workspaces, assignments, and active dashboards.</p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenCreate}
            style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", background: "#7e22ce", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#6b21a8"}
            onMouseLeave={e => e.currentTarget.style.background = "#7e22ce"}
          >
            <Plus size={16} /> New SMM Client
          </button>
        )}
      </div>

      {/* Active Workspace Bar */}
      <div style={{
        background: "linear-gradient(135deg, #fdf4ff 0%, #eff6ff 100%)",
        border: "1px solid #f3e8ff",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={20} color="#7e22ce" />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Active SMM Workspace</p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
              {activeClient ? `${activeClient.name} (${activeClient.businessClinicName || "No clinic name"})` : "No Workspace Selected"}
            </h3>
          </div>
        </div>
        {activeClient ? (
          <button 
            onClick={() => selectClient(null)}
            style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", background: "#fef2f2", border: "1px solid #fee2e2", height: 36, padding: "0 14px", borderRadius: 8, cursor: "pointer" }}
          >
            Clear Selection
          </button>
        ) : (
          <span style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>Select a client from the list below to enter their workspace</span>
        )}
      </div>

      {/* Filters & Search */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search clients by name, business, contact or email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", height: 42, padding: "0 16px 0 42px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff", color: "#0f172a" }}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : filteredClients.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "60px 20px", textAlign: "center" }}>
          <Building2 size={48} color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#334155", marginBottom: 6 }}>No Clients Found</h3>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Create a new SMM Client to get started.</p>
        </div>
      ) : (
        /* Clients Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {filteredClients.map((client) => {
            const isSelected = activeClient?.id === client.id;
            return (
              <div key={client.id} style={{
                background: "#fff",
                border: isSelected ? "2px solid #a855f7" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 24,
                boxShadow: isSelected ? "0 4px 12px rgba(168,85,247,0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                transition: "border-color 0.2s, box-shadow 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{client.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                      <Building2 size={14} /> <span>{client.businessClinicName || "Generic Business"}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 100,
                    background: client.status === "ACTIVE" ? "#ecfdf5" : "#f3f4f6",
                    color: client.status === "ACTIVE" ? "#059669" : "#6b7280"
                  }}>
                    {client.status}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px", minHeight: 38, lineBreak: "anywhere" }}>
                  {client.description || "No description provided."}
                </p>

                {/* Contact fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#334155", marginBottom: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  {client.contactPerson && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <User size={14} color="#64748b" /> <span style={{ fontWeight: 500 }}>{client.contactPerson}</span>
                    </div>
                  )}
                  {client.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Mail size={14} color="#64748b" /> <a href={`mailto:${client.email}`} className="text-purple-600 hover:underline">{client.email}</a>
                    </div>
                  )}
                  {client.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Phone size={14} color="#64748b" /> <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Team assignments */}
                {client.smmAssignedUsers && client.smmAssignedUsers.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Assigned Team</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {client.smmAssignedUsers.map((user: any) => (
                        <span key={user.id} style={{ fontSize: 12, padding: "2px 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#475569" }}>
                          {user.name || user.email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: "auto", display: "flex", gap: 8, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <button 
                    onClick={() => selectClient(client)}
                    style={{
                      flex: 1,
                      height: 36,
                      background: isSelected ? "#a855f7" : "#fff",
                      color: isSelected ? "#fff" : "#7e22ce",
                      border: isSelected ? "none" : "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    {isSelected ? (
                      <>Selected <Check size={14} /></>
                    ) : (
                      <>Enter Workspace <ExternalLink size={13} /></>
                    )}
                  </button>

                  {canEdit && (
                    <button 
                      onClick={() => handleOpenEdit(client)}
                      style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", cursor: "pointer" }}
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(client.id)}
                      style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #fee2e2", borderRadius: 8, color: "#ef4444", background: "#fef2f2", cursor: "pointer" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal dialog */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "100%",
            maxWidth: 600,
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 32,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            position: "relative"
          }} className="anim-scale">
            <button 
              onClick={() => setModalOpen(false)}
              style={{ position: "absolute", right: 20, top: 20, color: "#64748b", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {editingClient ? "Edit SMM Client" : "Create New SMM Client"}
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Fill out client profiles, clinic parameters, and assign team members.</p>

            {error && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#ef4444", fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Client Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr Prince Arthro Care"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Business / Clinic Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Arthro Care Clinic"
                    value={form.businessClinicName}
                    onChange={e => setForm(prev => ({ ...prev, businessClinicName: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Contact Person</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Prince"
                    value={form.contactPerson}
                    onChange={e => setForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Status</label>
                  <select 
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Email</label>
                  <input 
                    type="email" 
                    placeholder="e.g. contact@arthrocare.com"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +1 555-123-4567"
                    value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Website URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. https://arthrocare.com"
                    value={form.website}
                    onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Logo Image URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. https://domain.com/logo.png"
                    value={form.logo}
                    onChange={e => setForm(prev => ({ ...prev, logo: e.target.value }))}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Description</label>
                <textarea 
                  placeholder="Describe the client's business, clinic services, target audience..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: "100%", height: 70, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, resize: "none" }}
                />
              </div>

              {/* Team Assignment (Super Admins and Agency Owners only) */}
              {isAdmin && teamMembers.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Assign Team Members</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 110, overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: 8, padding: 10 }}>
                    {teamMembers.map((member) => {
                      const isAssigned = form.assignedUserIds.includes(member.id);
                      return (
                        <div 
                          key={member.id}
                          onClick={() => handleToggleTeamMember(member.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                            background: isAssigned ? "#f5f3ff" : "transparent",
                            border: isAssigned ? "1px solid #ddd6fe" : "1px solid transparent",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{member.name || member.email}</span>
                            <span style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 6px", borderRadius: 100, color: "#64748b" }}>{member.role}</span>
                          </div>
                          {isAssigned && <Check size={14} color="#7e22ce" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ height: 38, padding: "0 16px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  style={{
                    height: 38,
                    padding: "0 20px",
                    background: "#7e22ce",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none"
                  }}
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  {editingClient ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
