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
    <div className="max-w-[1000px] mx-auto py-10 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center">
              <Database className="text-[#2563eb]" size={24} strokeWidth={2.5} />
            </div>
            Backup & Restore
          </h1>
          <p className="text-[#64748b] text-[15px] font-medium">Protect your data with system snapshots and exports.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="h-11 px-5 bg-white border border-[#e2e8f0] rounded-xl flex items-center gap-2 text-sm font-bold text-[#475569] cursor-pointer hover:bg-[#f8fafc] transition-all active:scale-95 shadow-sm">
            <Upload size={18} />
            Upload Backup
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={processing} />
          </label>
          <button 
            onClick={handleCreate}
            disabled={processing}
            className="h-11 px-6 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl flex items-center gap-2 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Create Backup Now
          </button>
        </div>
      </div>

      {status.message && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 ${
          status.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
          status.type === "error" ? "bg-rose-50 border-rose-100 text-rose-700" :
          "bg-blue-50 border-blue-100 text-blue-700"
        }`}>
          {status.type === "success" ? <CheckCircle2 size={20} /> : status.type === "error" ? <AlertTriangle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
          <span className="text-sm font-bold">{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-[#f1f5f9] shadow-[0_8px_40px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-bottom border-[#f1f5f9] bg-[#f8fafc]/50 flex items-center gap-3">
          <HardDrive size={18} className="text-[#94a3b8]" />
          <h2 className="text-sm font-black text-[#64748b] uppercase tracking-widest">Available Backups</h2>
        </div>
        
        <div className="divide-y divide-[#f1f5f9]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#94a3b8]">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium">Scanning storage...</p>
            </div>
          ) : backups.length > 0 ? (
            backups.map((b) => (
              <div key={b.id} className="p-5 flex items-center justify-between hover:bg-[#fcfcfc] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] group-hover:bg-[#2563eb]/10 group-hover:text-[#2563eb] transition-colors">
                    <FileJson size={24} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1e293b] mb-0.5">{b.name}</h3>
                    <p className="text-xs text-[#94a3b8] font-medium">
                      Created on {new Date(b.createdAt).toLocaleDateString("en-IN", { 
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRestoreFromId(b.id)}
                    disabled={processing}
                    className="h-10 px-4 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => handleDownload(b.id, b.name)}
                    className="p-2.5 text-[#64748b] hover:bg-blue-50 hover:text-[#2563eb] rounded-xl transition-all"
                    title="Download Export"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="p-2.5 text-[#64748b] hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                    title="Delete Permanently"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-[#f8fafc] flex items-center justify-center mb-6">
                <Database className="text-[#cbd5e1]" size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#1e293b] mb-1">No backups found</h3>
              <p className="text-[#94a3b8] text-sm max-w-[280px]">Create your first system backup to protect your profiles and content.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">Important Note</h4>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            Restoring from a backup will update existing profiles and posts. If a profile listed in the backup is not found on your current dashboard, it will be skipped. Access tokens are not backed up for security — you may need to reconnect some accounts after a full restore.
          </p>
        </div>
      </div>
    </div>
  );
}
