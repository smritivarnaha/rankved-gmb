"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, ArrowLeft, Save, Building2, Phone, Globe, FileText, CheckCircle2, Upload } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: profileData, isLoading } = useSWR(`/api/profiles/${params.id}/gbp`, fetcher);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    phone: "",
    website: "",
    logoUrl: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (profileData?.data) {
      const gbp = profileData.data;
      setFormData({
        title: gbp.title || "",
        description: gbp.profile?.description || "",
        phone: gbp.phoneNumbers?.primaryPhone || "",
        website: gbp.websiteUri || "",
        logoUrl: gbp.logoUrl || "",
      });
    }
  }, [profileData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // 1. Sync GBP Text Details
      const res = await fetch(`/api/profiles/${params.id}/gbp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to update profile text details.");

      // 2. Sync Logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("id", params.id);
        logoFormData.append("logo", logoFile);

        const logoRes = await fetch("/api/profiles", { method: "PATCH", body: logoFormData });
        if (!logoRes.ok) {
          const lD = await logoRes.json();
          throw new Error(lD.error || "Failed to update profile logo.");
        }
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Loader2 className="anim-spin" style={{ width: 24, height: 24, color: "#9ca3af" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/profiles" style={{ padding: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#4b5563" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Edit Business Profile</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 4 }}>Syncs directly with Google Search & Maps</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: message.type === "success" ? "#15803d" : "#dc2626",
        }}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <Loader2 size={16} />}
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Business Information</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Logo Upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Profile Logo</label>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Current" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>No Logo</span>
                  )}
                </div>
                <div>
                  <label className="btn btn-primary" style={{ background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
                    Upload Image
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  </label>
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>Recommended: Square PNG/JPG.</p>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={14} /> Business Name
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={14} /> Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                style={{ height: 120, resize: "vertical" }}
                placeholder="Describe your business..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone size={14} /> Primary Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input w-full"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe size={14} /> Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input w-full"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 20, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: "8px 24px" }}>
                {saving ? <Loader2 className="anim-spin" size={16} style={{ marginRight: 8 }} /> : <Save size={16} style={{ marginRight: 8 }} />}
                Save Changes to Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
