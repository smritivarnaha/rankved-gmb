"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Phone, Building2, Plus, FileText, Clock, ExternalLink, Globe, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

interface ProfileDetail {
  id: string;
  name: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  fetchedAt: string;
  manual?: boolean;
}

export default function ProfileDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profiles");
        const data = await res.json();
        const profiles = data.data || [];
        const found = profiles.find((p: any) => p.id === params.id);
        setProfile(found || null);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    }
    loadProfile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--text-tertiary)]">Profile not found.</p>
        <Link href="/profiles" className="text-[var(--accent)] text-[13px] hover:underline mt-2 inline-block">
          ← Back to profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/profiles" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All profiles
      </Link>

      {/* Profile header */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">{profile.name}</h1>
                  {profile.manual && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)]">
                      Manual
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">{profile.accountName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[var(--text-secondary)] mt-4">
              {profile.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />{profile.address}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />{profile.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />{profile.accountName}
              </span>
              {profile.website && (
                <a href={profile.website} target="_blank" className="flex items-center gap-1.5 text-[var(--accent)] hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" />{profile.website}
                </a>
              )}
            </div>
          </div>
          <Link href={`/posts/new?profile=${profile.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Create post for this profile
          </Link>
        </div>
      </div>

      {/* Posts section */}
      <div className="bg-white border border-[var(--border)] rounded-lg">
        <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Posts for this profile</h2>
        </div>

        <div className="py-16 text-center">
          <FileText className="w-8 h-8 text-[var(--border)] mx-auto mb-2" />
          <p className="text-[13px] text-[var(--text-tertiary)] mb-1">No posts yet for this profile.</p>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3">
            {profile.manual
              ? "Posts will be published once your Google API quota is approved."
              : "Create a post to get started."}
          </p>
          <Link href={`/posts/new?profile=${profile.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--accent)] border border-[var(--accent)] rounded-md hover:bg-[var(--accent-light)] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Create first post
          </Link>
        </div>
      </div>

      {/* Info */}
      <p className="text-[11px] text-[var(--text-tertiary)]">
        Added: {format(new Date(profile.fetchedAt), "MMM d, yyyy")}
      </p>
    </div>
  );
}
