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
    <div style={{ minHeight: "100vh", background: "#f8fafc", margin: "-32px -40px", padding: "40px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Link
              href={backHref}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 12, textDecoration: "none", transition: "color 0.2s" }}
              className="hover-text-primary"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              {backLabel}
            </Link>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111", marginBottom: 4, letterSpacing: "-0.02em" }}>Create Post</h1>
            <p style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
              {profileId ? "Syncing directly with your Google Business Profile." : "Compose a new update for your locations."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {profileId && (
              <button 
                onClick={() => setIsAiModalOpen(true)}
                style={{ 
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", 
                  background: "#fff", color: "#2563eb", border: "1px solid #e2e8f0", borderRadius: 12, 
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <Sparkles style={{ width: 16, height: 16 }} /> AI Assistant
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Timeline — profile-aware */}
          <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} profileId={profileId} />

          {/* Editor — locked to profile if given */}
          <PostEditor timelineDate={sharedDate} onDateChange={setSharedDate} lockedProfileId={profileId} returnUrl={backHref} />
        </div>

        {profileId && (
          <AiGenerationModal 
            locationId={profileId}
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            onGenerated={() => {
              setIsAiModalOpen(false);
              if (from === "profile") router.push(`/profiles/${profileId}`);
              else router.push("/profiles");
            }}
          />
        )}
      </div>
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
