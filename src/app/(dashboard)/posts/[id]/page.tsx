"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PostTimeline } from "@/components/posts/post-timeline";
import { PostEditor } from "@/components/posts/post-editor";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sharedDate, setSharedDate] = useState("");
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("Post not found");
        return r.json();
      })
      .then(d => {
        setPost(d.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">Post not found</p>
        <p className="text-[13px] text-[var(--text-tertiary)] mb-4">This post may have been deleted.</p>
        <Link href="/profiles" className="text-[13px] text-[var(--accent)] hover:underline">← Back to profiles</Link>
      </div>
    );
  }

  const statusStyle =
    post.status === "PUBLISHED" ? "text-[var(--success)] bg-[var(--success-bg)]" :
    post.status === "SCHEDULED" ? "text-[var(--warning)] bg-[var(--warning-bg)]" :
    post.status === "FAILED" ? "text-[var(--error)] bg-[var(--error-bg)]" :
    "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", margin: "-32px -40px", padding: "40px" }}>
      <div className="space-y-8 max-w-[1040px] mx-auto">
        <div>
          <Link href={post.profileId ? `/profiles/${post.profileId}` : "/profiles"} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#2563eb] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to profile
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] font-extrabold text-[#111] tracking-tight">Edit Post</h1>
            <span className={`text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusStyle}`}>
              {post.status}
            </span>
          </div>
          <p className="text-[14px] text-[#666] font-medium mt-1">
            Created by {post.createdBy} · {new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} profileId={post.profileId} />
        <PostEditor initialData={post} timelineDate={sharedDate} onDateChange={setSharedDate} returnUrl={post.profileId ? `/profiles/${post.profileId}` : "/profiles"} />
      </div>
    </div>
  );
}
