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
        <Link href="/posts" className="text-[13px] text-[var(--accent)] hover:underline">← Back to posts</Link>
      </div>
    );
  }

  const statusStyle =
    post.status === "PUBLISHED" ? "text-[var(--success)] bg-[var(--success-bg)]" :
    post.status === "SCHEDULED" ? "text-[var(--warning)] bg-[var(--warning-bg)]" :
    post.status === "FAILED" ? "text-[var(--error)] bg-[var(--error-bg)]" :
    "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]";

  return (
    <div className="space-y-5 max-w-[900px] mx-auto">
      <div>
        <Link href="/posts" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to posts
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Edit post</h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyle}`}>
            {post.status.toLowerCase()}
          </span>
        </div>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
          Created by {post.createdBy} · {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>

      <PostTimeline onDateSelect={setSharedDate} selectedDate={sharedDate} />
      <PostEditor initialData={post} timelineDate={sharedDate} onDateChange={setSharedDate} />
    </div>
  );
}
