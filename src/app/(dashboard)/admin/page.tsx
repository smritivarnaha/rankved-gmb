"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldAlert, Users, Database, FileText, Loader2, UserPlus, UserCircle, Search, Trash2, X } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
  const { data, error: fetchError, isLoading, mutate } = useSWR("/api/admin/users", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const users = data?.data || [];
  const stats = data?.stats || { totalUsers: 0, totalProfiles: 0, totalPosts: 0 };
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (fetchError) setError(fetchError.message);
  }, [fetchError]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newUserName,
          username: newUserUsername,
          email: newUserEmail,
          password: newUserPassword
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create user");
      
      mutate();
      setShowCreateModal(false);
      
      setNewUserName("");
      setNewUserUsername("");
      setNewUserEmail("");
      setNewUserPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the user "${name}"?`)) return;
    
    // Optimistic update
    mutate({ ...data, data: users.filter((u: any) => u.id !== id) }, false);

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      mutate();
    } catch (err: any) {
      alert(err.message);
      mutate();
    }
  };

  const filteredUsers = users.filter((u: any) => 
    (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Access Denied</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-light)]/20 rounded-xl">
            <Shield className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)]">Platform overview and user management</p>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary px-6 h-12 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-200 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Create New Agency Owner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Total Users</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Database className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Total Profiles Connected</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalProfiles}</p>
          </div>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><FileText className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Total Posts</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalPosts}</p>
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
              placeholder="Search users..." 
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
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5"/>}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{user.name || "Unknown"}</div>
                          {user.email && <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'AGENCY_OWNER' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== "SUPER_ADMIN" && (
                        <button
                          onClick={() => handleDelete(user.id, user.name || user.username)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay anim-fade">
          <div className="modal-content anim-scale">
            <div className="modal-header">
              <h2 className="text-xl font-bold text-slate-900">Create New Agency Owner</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col overflow-hidden">
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input required type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Enter owner name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                  <input required type="text" value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Set a username" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (Optional)</label>
                  <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="owner@agency.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Initial Password</label>
                  <input required type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creatingUser} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
