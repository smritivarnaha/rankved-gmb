"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostTimeline } from "@/components/posts/post-timeline";
import { PostEditor } from "@/components/posts/post-editor";

export default function NewPostPage() {
  const [sharedDate, setSharedDate] = useState("");

  return (
    <div className="space-y-5 max-w-[900px] mx-auto">
      <div>
        <Link href="/posts" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to posts
        </Link>
        <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Create post</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Compose a new update for a Google Business Profile.</p>
      </div>

      <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} />
      <PostEditor timelineDate={sharedDate} onDateChange={setSharedDate} />
    </div>
  );
}
