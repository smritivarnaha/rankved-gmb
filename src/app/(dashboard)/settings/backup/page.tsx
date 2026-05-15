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
    <div className="max-w-[1200px] mx-auto py-12 px-6 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <Database className="text-white" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">
                Data Sovereignty
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">System Vault Active</span>
              </div>
            </div>
          </div>
          <p className="text-[#64748b] text-lg font-medium max-w-[500px] leading-relaxed">
            Infrastructure management for your business assets. Create snapshots or restore your environment with precision.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="h-12 px-6 bg-white border border-[#e2e8f0] rounded-2xl flex items-center gap-3 text-[14px] font-bold text-[#475569] cursor-pointer hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all active:scale-95 shadow-sm group">
            <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            Import Archive
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={processing} />
          </label>
          <button 
            onClick={handleCreate}
            disabled={processing}
            className="h-12 px-8 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl flex items-center gap-3 text-[14px] font-bold transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 group"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
            Snapshot Now
          </button>
        </div>
      </div>

      {status.message && (
        <div className={`mb-10 p-5 rounded-[24px] border-2 flex items-center gap-4 animate-in slide-in-from-top-4 duration-700 shadow-sm ${
          status.type === "success" ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" :
          status.type === "error" ? "bg-rose-50/50 border-rose-100 text-rose-800" :
          "bg-slate-50/80 border-slate-200 text-slate-800"
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            status.type === "success" ? "bg-emerald-100" : status.type === "error" ? "bg-rose-100" : "bg-slate-200"
          }`}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : status.type === "error" ? <AlertTriangle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
          </div>
          <div>
            <p className="text-[15px] font-black uppercase tracking-tight">{status.type === "success" ? "Operation Successful" : status.type === "error" ? "Critical Error" : "Processing Request"}</p>
            <p className="text-sm font-medium opacity-80">{status.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-[#f1f5f9] shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-8 border-b border-[#f1f5f9] bg-[#f8fafc]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <HardDrive size={16} className="text-slate-500" />
            </div>
            <h2 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Stored Snapshots</h2>
          </div>
          <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400">
            {backups.length} Archives Found
          </div>
        </div>
        
        <div className="divide-y divide-[#f1f5f9]">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-slate-50 border-t-[#0f172a] rounded-full animate-spin mb-6" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Repository</p>
            </div>
          ) : backups.length > 0 ? (
            backups.map((b) => (
              <div key={b.id} className="p-8 flex items-center justify-between hover:bg-[#fcfcfc] transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[22px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0f172a] group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                    <FileJson size={28} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-black text-[#0f172a] mb-1 group-hover:translate-x-1 transition-transform">{b.name}</h3>
                    <div className="flex items-center gap-4">
                      <p className="text-[13px] text-[#94a3b8] font-bold uppercase tracking-wider">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { 
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </p>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <p className="text-[13px] text-[#94a3b8] font-bold uppercase tracking-wider">
                        {new Date(b.createdAt).toLocaleTimeString("en-IN", { 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleRestoreFromId(b.id)}
                    disabled={processing}
                    className="h-11 px-6 bg-slate-50 hover:bg-[#0f172a] hover:text-white text-[#0f172a] rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => handleDownload(b.id, b.name)}
                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#0f172a] rounded-2xl transition-all"
                    title="Export Local"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                    title="Purge Data"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center px-6">
              <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 transform hover:scale-110 transition-transform duration-700">
                <Database className="text-slate-200" size={48} />
              </div>
              <h3 className="text-2xl font-black text-[#0f172a] mb-3">No Snapshots Found</h3>
              <p className="text-[#64748b] text-[15px] font-medium max-w-[320px] leading-relaxed">
                Your archive is currently empty. Initialize your first snapshot to protect your configuration.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 p-8 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200 flex flex-col md:flex-row items-center gap-8 border border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
          <AlertTriangle className="text-amber-400" size={32} />
        </div>
        <div className="flex-1">
          <h4 className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-2">Protocol Advisory</h4>
          <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
            Restoration cycles will synchronize your current environment with the snapshot state. Missing profiles will be bypassed. Post-restoration, manual verification of Google OAuth tokens is recommended for security compliance.
          </p>
        </div>
        <div className="px-6 py-3 bg-slate-800 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
          Security Level: High
        </div>
      </div>
    </div>
  );
}
