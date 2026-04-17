"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldAlert, CheckCircle, XCircle, Search, Mail, Loader2, UserPlus, UserCircle } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
         if(res.status === 403) throw new Error("You do not have permission to view this page.");
         throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: !currentStatus } : u));
      
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isApproved: !currentStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      // Revert on failure
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: currentStatus } : u));
      alert("Failed to update user approval status");
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Loading users...</p>
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
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[var(--accent-light)]/20 rounded-xl">
            <Shield className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage team members and approval requests</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center gap-4 bg-[var(--bg-secondary)]/50">
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
          
          <button className="ml-auto px-4 py-2 bg-white hover:bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            <UserPlus className="w-4 h-4" />
            Invite Team Member
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-light)]">
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5"/>}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{user.name || "Unknown"}</div>
                          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {user.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5" /> Auto-Approved
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleApproval(user.id, user.isApproved)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shadow-sm ${
                            user.isApproved 
                              ? 'bg-[var(--success-bg)] border-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)] hover:text-white'
                              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
                          }`}
                        >
                          {user.isApproved ? (
                            <><CheckCircle className="w-3.5 h-3.5" /> Approved</>
                          ) : (
                            <><XCircle className="w-3.5 h-3.5" /> Pending Approval</>
                          )}
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
    </div>
  );
}
