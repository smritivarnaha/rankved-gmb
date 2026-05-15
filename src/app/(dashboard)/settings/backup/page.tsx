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

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }} className="ds-anim-fade">
      <div style={{ display: "flex", flexDirection: "column", md: "row", alignItems: "end", justifyContent: "between", gap: 32, marginBottom: 48 } as any}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: "var(--radius-modal)", 
              background: "var(--neutral-900)", display: "flex", 
              alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-md)", border: "4px solid var(--neutral-50)"
            }}>
              <Database className="text-white" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="heading-section" style={{ fontSize: "var(--text-stat)", lineHeight: 1 }}>
                Data Sovereignty
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <div className="ds-dot ds-dot-published" style={{ width: 8, height: 8 }} />
                <span style={{ fontSize: "var(--text-micro)", fontWeight: "var(--fw-bold)", color: "var(--success)", textTransform: "uppercase", letterSpacing: "var(--ls-wide)" }}>
                  System Vault Active
                </span>
              </div>
            </div>
          </div>
          <p className="text-secondary" style={{ fontSize: "var(--text-lg)", maxWidth: 500, lineHeight: 1.6 }}>
            Infrastructure management for your business assets. Create snapshots or restore your environment with precision.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label className="ds-btn ds-btn-secondary" style={{ height: 44, padding: "0 24px" }}>
            <Upload size={18} style={{ marginRight: 8 }} />
            Import Archive
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={processing} />
          </label>
          <button 
            onClick={handleCreate}
            disabled={processing}
            className="ds-btn ds-btn-primary"
            style={{ height: 44, padding: "0 28px" }}
          >
            {processing ? <Loader2 size={18} className="anim-spin" /> : <Save size={18} style={{ marginRight: 8 }} />}
            Snapshot Now
          </button>
        </div>
      </div>

      {status.message && (
        <div className="ds-anim-fade" style={{ 
          marginBottom: 40, padding: 20, borderRadius: "var(--radius-modal)", 
          border: "1px solid", display: "flex", alignItems: "center", gap: 16,
          background: status.type === "success" ? "var(--success-subtle)" : status.type === "error" ? "var(--danger-subtle)" : "var(--bg-subtle)",
          borderColor: status.type === "success" ? "var(--success-muted)" : status.type === "error" ? "var(--danger-muted)" : "var(--border-subtle)",
          color: status.type === "success" ? "var(--success-text)" : status.type === "error" ? "var(--danger-text)" : "var(--text-primary)"
        }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 10, background: "white", 
            display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 
          }}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : status.type === "error" ? <AlertTriangle size={20} /> : <RefreshCw size={20} className="anim-spin" />}
          </div>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-extrabold)", textTransform: "uppercase", letterSpacing: "var(--ls-label)" }}>
              {status.type === "success" ? "Operation Successful" : status.type === "error" ? "Critical Error" : "Processing Request"}
            </p>
            <p style={{ fontSize: "var(--text-sm)", opacity: 0.8 }}>{status.message}</p>
          </div>
        </div>
      )}

      <div className="ds-card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
        <div style={{ padding: 24, borderBottom: "1px solid var(--border-subtle)", background: "var(--neutral-50)", display: "flex", alignItems: "center", justifyContent: "between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HardDrive size={18} className="text-tertiary" />
            <h2 style={{ fontSize: "var(--text-micro)", fontWeight: "var(--fw-extrabold)", color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Stored Snapshots
            </h2>
          </div>
          <span className="ds-badge ds-badge-neutral">
            {backups.length} Archives Found
          </span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ padding: 120, textAlign: "center" }}>
              <div className="anim-spin" style={{ width: 48, height: 48, border: "4px solid var(--neutral-100)", borderTopColor: "var(--brand)", borderRadius: "50%", margin: "0 auto 24px" }} />
              <p className="heading-card" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>Scanning Repository</p>
            </div>
          ) : backups.length > 0 ? (
            backups.map((b) => (
              <div key={b.id} style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "between", borderBottom: "1px solid var(--border-subtle)" }} className="ds-card-hover">
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ 
                    width: 56, height: 56, borderRadius: 16, background: "var(--neutral-50)", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--neutral-400)", border: "1px solid var(--border-subtle)"
                  }}>
                    <FileJson size={24} />
                  </div>
                  <div>
                    <h3 className="heading-card" style={{ marginBottom: 4 }}>{b.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontWeight: "var(--fw-bold)", textTransform: "uppercase" }}>
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--neutral-200)" }} />
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontWeight: "var(--fw-bold)", textTransform: "uppercase" }}>
                        {new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button 
                    onClick={() => handleRestoreFromId(b.id)}
                    disabled={processing}
                    className="ds-btn ds-btn-secondary"
                    style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-extrabold)", textTransform: "uppercase" }}
                  >
                    Restore
                  </button>
                  <button onClick={() => handleDownload(b.id, b.name)} className="ds-btn ds-btn-ghost" style={{ width: 40, height: 40, padding: 0 }} title="Export Local">
                    <Download size={18} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="ds-btn ds-btn-danger" style={{ width: 40, height: 40, padding: 0, background: "transparent" }} title="Purge Data">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 120, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 28, background: "var(--neutral-50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Database className="text-muted" size={40} />
              </div>
              <h3 className="heading-section">No Snapshots Found</h3>
              <p className="text-secondary" style={{ maxWidth: 300, margin: "8px auto 0" }}>
                Your archive is currently empty. Initialize your first snapshot to protect your configuration.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        marginTop: 48, padding: 32, background: "var(--neutral-900)", 
        borderRadius: "var(--radius-modal)", display: "flex", 
        flexDirection: "column", md: "row", alignItems: "center", gap: 32 
      } as any}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 }}>
          <AlertTriangle className="text-warning" size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: "var(--text-micro)", fontWeight: "var(--fw-extrabold)", color: "white", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>Protocol Advisory</h4>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--neutral-400)", lineHeight: 1.6 }}>
            Restoration cycles will synchronize your current environment with the snapshot state. Missing profiles will be bypassed. Post-restoration, manual verification of Google OAuth tokens is recommended for security compliance.
          </p>
        </div>
        <div className="ds-badge ds-badge-neutral" style={{ background: "rgba(255,255,255,0.05)", color: "var(--neutral-400)", padding: "8px 16px" }}>
          Security Level: High
        </div>
      </div>
    </div>
  );
}
