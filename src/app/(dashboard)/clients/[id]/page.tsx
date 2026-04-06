"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, MapPin, RefreshCw, Loader2, Megaphone, MoreVertical } from "lucide-react";
import Link from "next/link";

export default function ClientDetail({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncLocations = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/locations/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: params.id })
      });
      if (res.ok) {
        // Refresh client data to see new locations
        await fetchClient();
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  if (!client) {
    return <div className="text-center py-20 text-zinc-400">Client not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-2xl text-indigo-400 shadow-inner">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-indigo-400 text-sm mt-1 inline-block">
                  {client.website}
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={syncLocations}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 bg-zinc-900 rounded-md text-sm font-medium transition-colors disabled:opacity-50 min-w-[140px]"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing..." : "Sync Locations"}
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors shadow-md">
              Assign Post
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Managed Locations
              </h3>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full font-medium">
                {client.locations?.length || 0} Total
              </span>
            </div>
            
            <div className="divide-y divide-zinc-800/60">
              {!client.locations || client.locations.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <p className="mb-4">No locations synced yet.</p>
                  <button 
                    onClick={syncLocations}
                    className="text-indigo-400 font-medium hover:text-indigo-300 transition underline-offset-4 hover:underline"
                  >
                    Sync from Google Business Profile
                  </button>
                </div>
              ) : (
                client.locations.map((loc: any) => (
                  <div key={loc.id} className="p-5 flex justify-between items-center hover:bg-zinc-900/30 transition">
                    <div>
                      <h4 className="font-semibold text-zinc-100 mb-1">{loc.name}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-1 max-w-md">
                        {loc.address || "No address on file"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/posts?locationId=${loc.id}`}
                        className="p-2 border border-zinc-800 bg-zinc-900 rounded hover:bg-zinc-800 hover:text-white text-zinc-400 transition"
                        title="View Location Posts"
                      >
                        <Megaphone className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-zinc-200">About Client</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              {client.description || "No description provided for this client."}
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-3">
                <span className="text-zinc-500">Created On</span>
                <span className="text-zinc-300 font-medium">{format(new Date(client.createdAt), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-3">
                <span className="text-zinc-500">Client ID</span>
                <span className="text-zinc-300 font-mono text-xs">{client.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
