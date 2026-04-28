"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Wand2 } from "lucide-react";
import { PostTimeline } from "@/components/posts/post-timeline";
import { PostEditor } from "@/components/posts/post-editor";
import { useSearchParams, useRouter } from "next/navigation";
import { AiGenerationModal } from "@/components/ai/ai-components";

function NewPostContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileId = searchParams.get("profile") || undefined;
  const from = searchParams.get("from"); // "profile" to go back there
  const [sharedDate, setSharedDate] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Create</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {profileId ? "Creating for the selected profile." : "Compose a new update for a Google Business Profile."}
            </p>
          </div>
          {profileId && (
            <button 
              onClick={() => setIsAiModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "#f8fafc", color: "#2563eb", border: "1px solid #dbeafe", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Wand2 style={{ width: 15, height: 15 }} /> AI
            </button>
          )}
        </div>
      </div>

      {/* Timeline — profile-aware */}
      <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} profileId={profileId} />

      {/* Editor — locked to profile if given */}
      <PostEditor timelineDate={sharedDate} onDateChange={setSharedDate} lockedProfileId={profileId} returnUrl={backHref} />

      {profileId && (
        <AiGenerationModal 
          locationId={profileId}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onGenerated={() => {
            setIsAiModalOpen(false);
            // Refresh the page or redirect back to profile to see the new draft
            if (from === "profile") router.push(`/profiles/${profileId}`);
            else router.push("/profiles");
          }}
        />
      )}
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
