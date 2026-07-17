"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Globe } from "lucide-react";
import RankTracker from "@/components/profiles/RankTracker";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RankTrackerPage() {
  const { data: profilesRes, isLoading: loadingProfiles } = useSWR("/api/profiles", fetcher);
  const profiles = profilesRes?.data || [];

  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const activeProfile = profiles.find((p: any) => p.id === selectedProfileId);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 60px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Globe size={24} color="#2563eb" /> Local Heatmap Rank Tracker
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Track and visualize search rankings across a coordinate grid for any Google Business Profile.
          </p>
        </div>

        {/* Profile Dropdown Selection */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 320 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Select Profile:</span>
          {loadingProfiles ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
              <Loader2 size={16} className="animate-spin" /> Loading profiles...
            </div>
          ) : (
            <select
              value={selectedProfileId}
              onChange={e => setSelectedProfileId(e.target.value)}
              style={{ flex: 1, height: 38, padding: "0 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
            >
              <option value="">-- Choose a Profile --</option>
              {profiles.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Map Content Box */}
      {activeProfile ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, minHeight: 600 }}>
          <RankTracker
            key={activeProfile.id}
            profileId={activeProfile.id}
            profileName={activeProfile.name}
            address={activeProfile.address}
          />
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "100px 20px", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Globe size={48} color="#94a3b8" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>No Profile Selected</h2>
          <p style={{ fontSize: 14, maxWidth: 400, margin: 0 }}>
            Choose one of your connected Google Business Profiles from the dropdown menu above to start scanning keywords or view historical ranking grids.
          </p>
        </div>
      )}
    </div>
  );
}
