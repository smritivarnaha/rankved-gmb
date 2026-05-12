"use client";

import { useState } from "react";
import { Loader2, Save, MapPin, Phone, Globe, Clock, Info, CheckCircle2 } from "lucide-react";

interface ProfileData {
  name: string;
  phone: string;
  website: string;
  description: string;
  address: string;
  // Complex fields like hours would be added here
}

export function ProfileEditor({ profile, onUpdate }: { profile: any, onUpdate?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    name: profile.googleName || profile.name || "",
    phone: profile.phone || "",
    website: profile.website || "",
    description: profile.description || "",
    address: profile.address || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        if (onUpdate) onUpdate();
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim-fade-up max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-[32px] border-2 border-slate-100 p-10 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Edit Profile</h2>
            <p className="text-slate-500 font-medium">Changes will be pushed directly to Google Maps.</p>
          </div>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full animate-pulse">
              <CheckCircle2 className="w-5 h-5" />
              Saved to Google
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Info className="w-3 h-3" />
              Business Identity
            </h4>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Business Name</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your business to your customers..."
                />
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Phone className="w-3 h-3" />
              Contact & Presence
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Website URL</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Location Details
            </h4>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Business Address</label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </section>

          <div className="pt-8 border-t border-slate-50">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes to Google
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-[24px] flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-black text-amber-900 uppercase tracking-widest text-xs mb-1">Update Notice</h4>
          <p className="text-amber-800 text-sm font-medium leading-relaxed">
            Google may take up to 48 hours to verify and publish these changes. Some edits might require manual review by Google's team.
          </p>
        </div>
      </div>
    </div>
  );
}
