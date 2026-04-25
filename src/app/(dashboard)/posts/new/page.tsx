"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PostTimeline } from "@/components/posts/post-timeline";
import { PostEditor } from "@/components/posts/post-editor";
import { useSearchParams } from "next/navigation";

function NewPostContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profile") || undefined;
  const from = searchParams.get("from"); // "profile" to go back there
  const [sharedDate, setSharedDate] = useState("");

  const backHref = from === "profile" && profileId ? `/profiles/${profileId}` : "/profiles";
  const backLabel = from === "profile" && profileId ? "← Back to profile" : "← Back to profiles";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={backHref}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-tertiary)", marginBottom: 10 }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          {backLabel}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Create Post</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {profileId ? "Creating for the selected profile." : "Compose a new update for a Google Business Profile."}
        </p>
      </div>

      {/* Timeline — profile-aware */}
      <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} profileId={profileId} />

      {/* Editor — locked to profile if given */}
      <PostEditor timelineDate={sharedDate} onDateChange={setSharedDate} lockedProfileId={profileId} />
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>Loading...</div>}>
      <NewPostContent />
    </Suspense>
  );
}
