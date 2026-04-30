"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Loader2, ShieldAlert, X, Shield, Search, UserCircle, MapPin, Mail, Settings, UserPlus } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TeamPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const canManageTeam = role === "SUPER_ADMIN" || role === "AGENCY_OWNER";
  
  const { data: teamData, isLoading: teamLoading, mutate: mutateTeam } = useSWR(canManageTeam ? "/api/team" : null, fetcher);
  const { data: profileData, isLoading: profilesLoading } = useSWR(canManageTeam ? "/api/profiles" : null, fetcher);

  const members = teamData?.data || [];
  const profiles = profileData?.data || [];
  const loading = teamLoading || profilesLoading;
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: "", username: "", email: "", password: "", 
    canPublishNow: true, canSchedule: true, minScheduleDays: 0, assignedLocations: [] as string[]
  });

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
      mutateTeam(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => { 
    if (!confirm(`Remove ${name} from the team?`)) return; 
    
    // Optimistic update
    mutateTeam({ ...teamData, data: members.filter((m: any) => m.id !== id) }, false);
    
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: "DELETE" }); 
      if(!res.ok) throw new Error("Failed to delete user");
      mutateTeam();
    } catch (err: any) {
      alert(err.message);
      mutateTeam();
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

  const filteredMembers = members.filter((u: any) => 
    u.role === "TEAM_MEMBER" && (
      (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
      (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    )
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-light)]/20 rounded-xl">
            <Users className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Management</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage team access and permissions</p>
          </div>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary px-6 h-12 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add New Team Member
        </button>
      </div>

      {!(session as any)?.accessToken && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3 text-indigo-800 shadow-sm">
          <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Connect your Google Business Profile</h3>
            <p className="text-xs text-indigo-700/80 mb-3">To assign locations to your team members, you must first connect your Google Account in settings. This is securely used only to fetch your managed profiles.</p>
            <a href="/settings" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
              Connect Google Account →
            </a>
          </div>
        </div>
      )}

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
                filteredMembers.map((user: any) => (
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
        <div className="modal-overlay anim-fade">
          <div className="modal-content anim-scale">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Add Team Member</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="flex flex-col overflow-hidden">
              <div className="modal-body space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                    <input required type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="johndoe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (Optional)</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Initial Password <span className="text-red-500">*</span></label>
                    <input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Set a password" />
                  </div>
                </div>

                {/* Permissions */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><Settings className="w-4 h-4 text-slate-400"/> Permissions & Access</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Publishing Rights</label>
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                      >
                        <option value="FULL">Full Access (Immediate Publish & Schedule)</option>
                        <option value="SCHEDULE">Schedule Only (Requires Advance Notice)</option>
                        <option value="DRAFT">Draft Only (Requires Approval)</option>
                      </select>
                    </div>
                    
                    {!form.canPublishNow && form.canSchedule && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <label className="block text-sm font-semibold text-amber-900 mb-1">Minimum Notice Period (Days)</label>
                        <div className="text-xs text-amber-700/70 mb-3">Posts must be scheduled at least this many days in advance.</div>
                        <input type="number" min="0" value={form.minScheduleDays} onChange={e => setForm({...form, minScheduleDays: parseInt(e.target.value) || 0})} className="w-24 px-4 py-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Assignment */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-slate-400"/> Assigned Locations</h3>
                  
                  {profiles.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-sm text-slate-500">No profiles synced yet. Please connect Google in Settings.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                      {profiles.map((loc: any) => (
                        <label key={loc.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${form.assignedLocations.includes(loc.id) ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={form.assignedLocations.includes(loc.id)} 
                            onChange={() => toggleLocation(loc.id)} 
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{loc.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">{loc.address}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary px-6 py-2.5 font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
