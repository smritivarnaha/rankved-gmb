"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Star, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

interface Prediction {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
}

export function FindBusinessSearch({ onSelect }: { onSelect: (place: PlaceDetails) => void }) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 3 || selectedPlace?.name === query) {
        setPredictions([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setPredictions(data.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPrediction = async (prediction: Prediction) => {
    setQuery(prediction.description);
    setShowDropdown(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/gbp/search?placeId=${prediction.placeId}`);
      const data = await res.json();
      const details = data.data;
      if (details) {
        setSelectedPlace(details);
        onSelect(details);
      }
    } catch (err) {
      console.error("Details error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative" ref={dropdownRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-5 bg-white border-2 border-slate-100 rounded-3xl text-lg font-semibold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
            placeholder="Type your business name as it appears on Maps..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 3 && setShowDropdown(true)}
          />
          {loading && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 mt-3 w-full bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-indigo-100/50 overflow-hidden anim-fade-up">
            {predictions.map((p) => (
              <button
                key={p.placeId}
                className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors flex items-start gap-4 border-b border-slate-50 last:border-0"
                onClick={() => handleSelectPrediction(p)}
              >
                <div className="mt-1 w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{p.mainText}</p>
                  <p className="text-sm text-slate-400">{p.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Business Preview (Grexa Style) */}
      {selectedPlace && (
        <div className="mt-8 bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-xl shadow-slate-100/50 anim-fade-up">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPlace.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-black text-slate-700">{selectedPlace.rating || "N/A"}</span>
                  </div>
                  <span className="text-sm text-slate-400 font-bold">•</span>
                  <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">{selectedPlace.user_ratings_total || 0} Reviews</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Found on Google
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Location Address</p>
            <p className="text-slate-900 font-semibold">{selectedPlace.formatted_address}</p>
          </div>

          <button 
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group"
          >
            Connect to Manage Access
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
      
      {!selectedPlace && !loading && (
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">💡 Tip</p>
          <p className="text-slate-500 font-medium">Type your business name as it appears on Google Maps</p>
        </div>
      )}
    </div>
  );
}
