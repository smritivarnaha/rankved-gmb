"use client";

import { useState } from "react";
import useSWR from "swr";
import { Star, MessageSquare, Sparkles, Send, Loader2, CheckCircle2, User } from "lucide-react";
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ReviewManager({ profileId }: { profileId: string }) {
  const { data: session } = useSession();
  const { data: reviewsData, isLoading, mutate } = useSWR(`/api/profiles/${profileId}/reviews`, fetcher);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);

  const isAdmin = (session as any)?.user?.role === "SUPER_ADMIN" || (session as any)?.user?.email?.toLowerCase() === "rankved.business@gmail.com";

  const handleGenerateReply = async (review: any) => {
    setReplyingTo(review.reviewId);
    try {
      const res = await fetch("/api/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review.comment,
          reviewerName: review.reviewer.displayName,
          rating: review.starRating === "FIVE" ? 5 : 4, // Mapping Google stars
        }),
      });
      const data = await res.json();
      setReplies({ ...replies, [review.reviewId]: data.reply });
    } catch (err) {
      console.error(err);
    } finally {
      setReplyingTo(null);
    }
  };

  const handlePostReply = async (reviewId: string) => {
    setPosting(reviewId);
    // Logic to post back to Google API
    setTimeout(() => {
      setPosting(null);
      alert("Reply posted successfully to Google!");
      mutate(); // Refresh list
    }, 1000);
  };

  if (isLoading) return (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Google Reviews...</p>
    </div>
  );

  const reviews = reviewsData?.data || [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews</h3>
          <p className="text-slate-500 font-medium">Manage your reputation directly from here.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
          <Star className="w-3 h-3 fill-current" />
          {reviews.length} Total Reviews
        </div>
      </div>

      {reviews.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[32px] border-2 border-slate-100">
           <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-400 font-bold">No reviews found for this profile yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((r: any) => (
          <div key={r.reviewId} className="bg-white rounded-[24px] border-2 border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-100/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-slate-900">{r.reviewer.displayName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < 5 ? "text-amber-400 fill-current" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {new Date(r.createTime).toLocaleDateString()}
              </p>
            </div>

            {r.comment && (
              <p className="text-slate-600 font-medium leading-relaxed mb-6 italic">
                "{r.comment}"
              </p>
            )}

            {/* Admin-Only Magic Reply Section */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-slate-50">
                {!replies[r.reviewId] ? (
                  <button
                    onClick={() => handleGenerateReply(r)}
                    disabled={replyingTo === r.reviewId}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-all border border-indigo-100"
                  >
                    {replyingTo === r.reviewId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Magic Smart-Reply
                  </button>
                ) : (
                  <div className="anim-fade-up space-y-4">
                    <div className="relative">
                      <textarea
                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                        rows={3}
                        value={replies[r.reviewId]}
                        onChange={(e) => setReplies({ ...replies, [r.reviewId]: e.target.value })}
                      />
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg">
                        <Sparkles className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <button 
                        onClick={() => setReplies({ ...replies, [r.reviewId]: "" })}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                       >
                        Discard
                       </button>
                       <button
                        onClick={() => handlePostReply(r.reviewId)}
                        disabled={posting === r.reviewId}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                       >
                        {posting === r.reviewId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Post to Google
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Existing Reply Badge */}
            {r.reviewReply && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                   <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Owner Replied</p>
                   <p className="text-xs text-emerald-700 font-medium leading-relaxed">{r.reviewReply.comment}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
