"use client";

import { format } from "date-fns";
import { MapPin, RotateCw } from "lucide-react";

const locations = [
  { id: "1", name: "Downtown Office", address: "123 Main St, Portland, OR", phone: "(503) 555-0100", client: "Sunrise Dental", synced: "2026-04-01T10:00:00" },
  { id: "2", name: "East Branch", address: "456 Oak Ave, Portland, OR", phone: "(503) 555-0120", client: "Sunrise Dental", synced: "2026-04-01T10:00:00" },
  { id: "3", name: "West Side Clinic", address: "789 Pine Blvd, Beaverton, OR", phone: "(503) 555-0140", client: "Sunrise Dental", synced: "2026-04-01T10:00:00" },
  { id: "4", name: "Main Branch", address: "100 Tech Park Dr, Portland, OR", phone: "(503) 555-0200", client: "TechWave Solutions", synced: "2026-03-28T10:00:00" },
  { id: "5", name: "Training Center", address: "300 Campus Dr, Portland, OR", phone: "(503) 555-0300", client: "GrowthHub Academy", synced: "2026-03-30T10:00:00" },
  { id: "6", name: "Cafe Central", address: "50 Food Court Ln, Portland, OR", phone: "(503) 555-0400", client: "Green Eats", synced: "2026-04-02T10:00:00" },
];

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Locations</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Synced Google Business Profile locations.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-3.5 py-2 border border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-medium rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <RotateCw className="w-3.5 h-3.5" /> Sync all
        </button>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-left text-[12px] uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium hidden md:table-cell">Address</th>
              <th className="px-5 py-3 font-medium hidden lg:table-cell">Phone</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium hidden sm:table-cell">Last synced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {locations.map(loc => (
              <tr key={loc.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-medium text-[var(--text-primary)]">{loc.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden md:table-cell">{loc.address}</td>
                <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden lg:table-cell">{loc.phone}</td>
                <td className="px-5 py-3.5 text-[var(--text-secondary)]">{loc.client}</td>
                <td className="px-5 py-3.5 text-[var(--text-tertiary)] text-[12px] hidden sm:table-cell">{format(new Date(loc.synced), "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
