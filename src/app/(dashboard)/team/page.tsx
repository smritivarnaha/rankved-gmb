"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Loader2, ShieldAlert, X, Shield, Search, UserCircle, MapPin, Mail, Settings } from "lucide-react";

export default function TeamPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const canManageTeam = role === "SUPER_ADMIN" || role === "AGENCY_OWNER";
  
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: "", username: "", email: "", password: "", 
    canPublishNow: true, canSchedule: true, minScheduleDays: 0, assignedLocations: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, profilesRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/profiles")
      ]);
      
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.data || []);
      } else {
        if(membersRes.status === 403) throw new Error("You do not have permission to manage team members.");
        throw new Error("Failed to fetch team members");
      }

      if (profilesRes.ok) {
        const data = await profilesRes.json();
        setProfiles(data.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (canManageTeam) fetchData(); 
    else { setLoading(false); setError("You don't have permission to manage team members."); }
  }, [canManageTeam]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      const res = await fetch("/api/team", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(form) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");
      
      setForm({ name: "", username: "", email: "", password: "", canPublishNow: true, canSchedule: true, minScheduleDays: 0, assignedLocations: [] }); 
      setShowForm(false); 
      fetchData(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => { 
    if (!confirm(`Remove ${name} from the team?`)) return; 
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: "DELETE" }); 
      if(!res.ok) throw new Error("Failed to delete user");
      fetchData(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleLocation = (locId: string) => {
    setForm(prev => {
      const isSelected = prev.assignedLocations.includes(locId);
      return {
        ...prev,
        assignedLocations: isSelected 
          ? prev.assignedLocations.filter(id => id !== locId)
          : [...prev.assignedLocations, locId]
      };
    });
  };

  const filteredMembers = members.filter(u => 
    (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Loading team members...</p>
      </div>
    );
  }

  if (error || !canManageTeam) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Access Denied</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">{error || "You do not have permission to manage team members."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--accent-light)]/20 rounded-xl">
            <Users className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Management</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage team access and permissions</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex flex-wrap items-center gap-4 bg-[var(--bg-secondary)]/50">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow"
            />
          </div>
          
          <button 
            onClick={() => setShowForm(true)}
            className="ml-auto px-4 py-2 bg-[var(--accent)] hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-light)]">
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assigned Locations</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
                    No team members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5"/>}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{user.name || "Unknown"} <span className="text-xs text-gray-500 font-normal ml-1">@{user.username}</span></div>
                          {user.email && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{user.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          user.canPublishNow ? 'bg-green-100 text-green-700' : 
                          user.canSchedule ? 'bg-blue-100 text-blue-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {user.canPublishNow ? "Full Access" : user.canSchedule ? "Schedule Only" : "Draft Only"}
                        </span>
                        {!user.canPublishNow && user.canSchedule && user.minScheduleDays > 0 && (
                          <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700">
                            Min {user.minScheduleDays} Days Notice
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--text-secondary)]">
                        {user.assignedLocations?.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <MapPin className="w-3.5 h-3.5" />
                            {user.assignedLocations.map((l:any) => l.name).join(", ")}
                          </div>
                        ) : (
                          <span className="italic">No locations assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Team Member</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm" placeholder="johndoe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm" placeholder="Set initial password" />
                </div>
              </div>

              {/* Permissions */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><Settings className="w-4 h-4"/> Permissions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Publishing Rights</label>
                    <div className="text-xs text-gray-500 mb-2">Determine what this team member is allowed to do with posts.</div>
                    <select 
                      value={form.canPublishNow ? "FULL" : form.canSchedule ? "SCHEDULE" : "DRAFT"} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "FULL") {
                          setForm({...form, canPublishNow: true, canSchedule: true, minScheduleDays: 0});
                        } else if (val === "SCHEDULE") {
                          setForm({...form, canPublishNow: false, canSchedule: true, minScheduleDays: 2});
                        } else {
                          setForm({...form, canPublishNow: false, canSchedule: false, minScheduleDays: 0});
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm bg-white"
                    >
                      <option value="FULL">Full Access (Can Publish Immediately & Schedule)</option>
                      <option value="SCHEDULE">Schedule Only (Requires Advance Notice)</option>
                      <option value="DRAFT">Draft Only (Must submit for approval)</option>
                    </select>
                  </div>
                  
                  {!form.canPublishNow && form.canSchedule && (
                    <div className="pl-2 border-l-2 border-indigo-200">
                      <label className="block text-sm font-medium text-gray-800 mb-1">Minimum Schedule Days</label>
                      <div className="text-xs text-gray-500 mb-2">Require the user to schedule posts at least this many days in advance (for review).</div>
                      <input type="number" min="0" value={form.minScheduleDays} onChange={e => setForm({...form, minScheduleDays: parseInt(e.target.value) || 0})} className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Location Assignment */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><MapPin className="w-4 h-4"/> Assigned Locations</h3>
                <div className="text-xs text-gray-500 mb-3">Select the Google Business Profiles this member can manage.</div>
                
                {profiles.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    You don't have any locations connected. Connect your Google account in Settings first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-1">
                    {profiles.map(loc => (
                      <label key={loc.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${form.assignedLocations.includes(loc.id) ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={form.assignedLocations.includes(loc.id)} 
                          onChange={() => toggleLocation(loc.id)} 
                          className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)] cursor-pointer" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{loc.name}</div>
                          <div className="text-xs text-gray-500 truncate">{loc.address}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
