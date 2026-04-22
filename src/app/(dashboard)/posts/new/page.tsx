"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostTimeline } from "@/components/posts/post-timeline";
import { PostEditor } from "@/components/posts/post-editor";

export default function NewPostPage() {
  const [sharedDate, setSharedDate] = useState("");

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/posts"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5f6368", marginBottom: 10 }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Back to posts
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: "#202124", marginBottom: 4 }}>Create post</h1>
        <p style={{ fontSize: 14, color: "#5f6368" }}>Compose a new update for a Google Business Profile.</p>
      </div>

      {/* Timeline */}
      <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} />

      {/* Editor */}
      <PostEditor timelineDate={sharedDate} onDateChange={setSharedDate} />
    </div>
  );
}
