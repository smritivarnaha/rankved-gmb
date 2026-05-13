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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
      {/* Header Area */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Link
            href={backHref}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 10, textDecoration: "none" }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            {backLabel}
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" }}>Create Post</h1>
          <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
            Compose and schedule updates for your Google Business Profile.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {profileId && (
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="btn btn-outline"
              style={{ background: "#fff", color: "#2563eb", borderColor: "#e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              <Sparkles style={{ width: 16, height: 16, marginRight: 8 }} /> AI Assistant
            </button>
          )}
        </div>
      </div>

      {/* Main Container: 2-pane layout is handled INSIDE PostEditor */}
      <PostEditor 
        timelineDate={sharedDate} 
        onDateChange={setSharedDate} 
        lockedProfileId={profileId} 
        returnUrl={backHref}
        showTimelineTop={true} // We'll move timeline support into PostEditor or keep it here
      />

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
