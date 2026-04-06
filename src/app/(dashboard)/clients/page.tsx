"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Plus, MapPin, ArrowRight } from "lucide-react";

const demoClients = [
  { id: "1", name: "Sunrise Dental", description: "Full-service dental practice — 3 locations", createdAt: "2026-01-15T10:00:00", locations: 3 },
  { id: "2", name: "TechWave Solutions", description: "IT consulting and managed services", createdAt: "2026-02-10T10:00:00", locations: 2 },
  { id: "3", name: "GrowthHub Academy", description: "Professional training and development", createdAt: "2026-03-01T10:00:00", locations: 4 },
  { id: "4", name: "Green Eats", description: "Organic cafe chain — sustainable dining", createdAt: "2026-03-20T10:00:00", locations: 3 },
];

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Clients</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Businesses you manage.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add client
        </button>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg">
        <div className="divide-y divide-[var(--border-light)]">
          {demoClients.map(client => (
            <Link key={client.id} href={`/clients/${client.id}`}
              className="px-5 py-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors group block">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[14px] font-semibold text-[var(--text-secondary)] shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">{client.name}</p>
                  <p className="text-[12px] text-[var(--text-tertiary)] truncate">{client.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[12px] text-[var(--text-secondary)]">{client.locations} locations</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Added {format(new Date(client.createdAt), "MMM d, yyyy")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
