"use client";

import { useState, useEffect } from "react";
import { 
  Download, Trash2, Upload, Database, 
  RefreshCw, FileJson, AlertTriangle, 
  Loader2, CheckCircle2, Save, HardDrive
} from "lucide-react";

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.data) setBackups(data.data);
    } catch (err) {
      console.error("Failed to fetch backups:", err);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setProcessing(true);
    setStatus({ type: "info", message: "Creating system snapshot..." });
    try {
      const res = await fetch("/api/backup?action=export");
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", message: "Backup created successfully!" });
        fetchBackups();
      } else {
        setStatus({ type: "error", message: data.error || "Failed to create backup" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Network error" });
    }
    setProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this backup permanently to save space?")) return;
    try {
      const res = await fetch(`/api/backup?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBackups(backups.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/backup?id=${id}`, { method: "PATCH" });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download backup data.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!confirm("RESTORE SYSTEM DATA?\n\nThis will overwrite or update existing profiles and posts with the data from this file. Proceed?")) return;
        
        setProcessing(true);
        setStatus({ type: "info", message: "Restoring system data... this may take a moment." });
        
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: json.data || json }) // Support both wrapped and unwrapped JSON
        });
        
        const result = await res.json();
        if (result.success) {
          setStatus({ 
            type: "success", 
            message: `Data restored successfully! ${result.skippedLocations > 0 ? `(${result.skippedLocations} locations skipped due to errors)` : ""}` 
          });
        } else {
          setStatus({ type: "error", message: result.error || "Restore failed." });
        }
      } catch (err) {
        alert("Invalid backup file format.");
      }
      setProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleRestoreFromId = async (id: string) => {
    if (!confirm("Restore system to this state? Current profiles and posts will be updated.")) return;
    
    setProcessing(true);
    setStatus({ type: "info", message: "Restoring state from database..." });
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: id })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", message: "System state restored successfully!" });
      } else {
        setStatus({ type: "error", message: data.error || "Restore failed" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Network error" });
    }
    setProcessing(false);
  };

  // Styles matching the Dashboard 'Amazing UI'
  const cardStyle = {
    background: "#fff", border: "1px solid #eaeaea",
    borderRadius: 8, padding: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  };

  const btnPrimary = {
    height: 40, padding: "0 20px", background: "#2563EB",
    color: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 600,
    border: "none", cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 8, transition: "all 0.2s",
    textDecoration: "none"
  };

  const btnSecondary = {
    height: 40, padding: "0 20px", background: "#fff",
    color: "#475569", borderRadius: 6, fontSize: 13, fontWeight: 600,
    border: "1px solid #e2e8f0", cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 8, transition: "all 0.2s",
    textDecoration: "none"
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }} className="ds-anim-fade">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            Backup & Restore
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Protect your system data with cloud snapshots and local exports.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={btnSecondary} className="hover-bg-muted">
            <Upload size={16} />
            Import Archive
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={processing} />
          </label>
          <button 
            onClick={handleCreate}
            disabled={processing}
            style={btnPrimary}
            className="hover-shadow-blue"
          >
            {processing ? <Loader2 size={16} className="anim-spin" /> : <Save size={16} />}
            Snapshot Now
          </button>
        </div>
      </div>

      {status.message && (
        <div style={{ 
          marginBottom: 24, padding: "16px 20px",
          background: status.type === "success" ? "#f0fdf4" : status.type === "error" ? "#fef2f2" : "#fff",
          border: `1px solid ${status.type === "success" ? "#bbf7d0" : status.type === "error" ? "#fecaca" : "#eaeaea"}`,
          borderLeft: `4px solid ${status.type === "success" ? "#16a34a" : status.type === "error" ? "#dc2626" : "#2563eb"}`,
          borderRadius: 8, display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
        }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, 
            background: status.type === "success" ? "#dcfce7" : status.type === "error" ? "#fee2e2" : "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 
          }}>
            {status.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600" /> : status.type === "error" ? <AlertTriangle size={18} className="text-rose-600" /> : <RefreshCw size={18} className="anim-spin text-blue-600" />}
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: status.type === "success" ? "#166534" : status.type === "error" ? "#991b1b" : "#1e40af", margin: 0 }}>
            {status.message}
          </p>
        </div>
      )}

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HardDrive size={16} color="#64748B" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Available Snapshots</h2>
          </div>
          <span style={{ fontSize: 11, background: "#fff", border: "1px solid #eaeaea", color: "#64748B", padding: "2px 10px", borderRadius: 100, fontWeight: 600 }}>
            {backups.length} Archives
          </span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div className="anim-spin" style={{ width: 40, height: 40, border: "3px solid #f1f5f9", borderTopColor: "#2563eb", borderRadius: "50%", margin: "0 auto 16px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#64748B", margin: 0 }}>Scanning local storage...</p>
            </div>
          ) : backups.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #eaeaea", background: "#fff" }}>
                  <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>SNAPSHOT NAME</th>
                  <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>CREATED ON</th>
                  <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f8f9fa" }} className="hover-bg-muted">
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f8f9fa", border: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileJson size={16} color="#64748B" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{b.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                        {new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                        <button 
                          onClick={() => handleRestoreFromId(b.id)}
                          disabled={processing}
                          style={{ ...btnSecondary, height: 32, fontSize: 12, padding: "0 12px" }}
                        >
                          Restore
                        </button>
                        <button onClick={() => handleDownload(b.id, b.name)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", border: "1px solid #eaeaea", borderRadius: 6, color: "#64748B", cursor: "pointer" }} title="Export Local">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDelete(b.id)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 6, color: "#dc2626", cursor: "pointer" }} title="Delete Forever">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <Database style={{ width: 40, height: 40, color: "#CBD5E1", margin: "0 auto 16px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>No snapshots found</p>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Create your first snapshot to secure your system data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Advisory Banner */}
      <div style={{ 
        marginTop: 32, padding: "20px 24px", 
        background: "#111827", borderRadius: 8, 
        display: "flex", alignItems: "center", gap: 20 
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 }}>
          <AlertTriangle className="text-amber-400" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, color: "#fff", fontWeight: 600, margin: "0 0 2px" }}>Protocol Advisory</p>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>
            Restoration cycles will synchronize your current environment with the snapshot state. Missing profiles will be bypassed. Access tokens are not backed up for security.
          </p>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Security: High
        </div>
      </div>
    </div>
  );
}
