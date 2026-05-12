"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Wand2, Sparkles } from "lucide-react";
import { PostTimeline } from "@/components/posts/post-timeline";
import { PostEditor } from "@/components/posts/post-editor";
import { useSearchParams, useRouter } from "next/navigation";
import { AiGenerationModal } from "@/components/ai/ai-components";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <div style={{ marginBottom: 32 }}>
        <Link
          href={backHref}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 16, textDecoration: "none", transition: "color 0.2s" }}
          className="hover-text-primary"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          {backLabel}
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>Create Post</h1>
            <p style={{ fontSize: 14, color: "#64748b", maxWidth: 500, lineHeight: 1.5 }}>
              {profileId ? "Syncing directly with your Google Business Profile." : "Compose a new update for your Google Business Profile locations."}
            </p>
          </div>
          {profileId && (
            <button 
              onClick={() => setIsAiModalOpen(true)}
              style={{ 
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", 
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", 
                color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, 
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.05)"
              }}
              className="btn-ai-hover"
            >
              <Sparkles style={{ width: 16, height: 16 }} /> AI Assistant
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
    <Suspense fallback={
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <Skeleton style={{ width: 120, height: 14, marginBottom: 16 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <Skeleton style={{ width: 200, height: 32, marginBottom: 8 }} />
              <Skeleton style={{ width: 400, height: 16 }} />
            </div>
            <Skeleton style={{ width: 130, height: 40, borderRadius: 10 }} />
          </div>
        </div>
        <Skeleton style={{ width: "100%", height: 120, borderRadius: 14, marginBottom: 24 }} />
        <Skeleton style={{ width: "100%", height: 500, borderRadius: 14 }} />
      </div>
    }>
      <NewPostContent />
    </Suspense>
  );
}
