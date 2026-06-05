"use client";

import { useState, useEffect } from "react";
import { Loader2, X, FileDown, AlertCircle } from "lucide-react";

interface MonthlyReportModalProps {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  address?: string;
}

export function MonthlyReportModal({
  profileId,
  profileName,
  isOpen,
  onClose,
  logoUrl,
  address
}: MonthlyReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default to current month and year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [brandingText, setBrandingText] = useState("");
  const [includeDate, setIncludeDate] = useState(false);
  const [includeReviews, setIncludeReviews] = useState(false);
  const [columns, setColumns] = useState<number>(2); // 2 or 3, default to 2

  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i); // 2 years back, current year, 1 year ahead

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function proxyUrl(url?: string) {
    if (!url) return "";
    if (url.startsWith("data:")) return url;
    
    let targetUrl = url;
    if (url.startsWith("gbp:")) {
      targetUrl = url.replace("gbp:", "");
    }
    
    if (targetUrl.includes("maps.googleapis.com") || targetUrl.includes("places.googleapis.com")) {
      return targetUrl;
    }
    
    return `${window.location.origin}/api/proxy/media?url=${encodeURIComponent(targetUrl)}`;
  }

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    let posts: any[] = [];
    let fetchedFromGoogle = false;

    // 1. Try fetching from Google Live API
    try {
      const res = await fetch(`/api/profiles/${profileId}/google-posts?pageSize=100`);
      if (res.ok) {
        const data = await res.json();
        posts = data.data || [];
        fetchedFromGoogle = true;
      } else {
        console.warn("Google Live Feed fetch failed, attempting local DB fallback...");
      }
    } catch (e) {
      console.warn("Network error fetching Google Live Feed, attempting local DB fallback...", e);
    }

    // 2. Fall back to local DB if Google fetch failed or returned nothing
    if (!fetchedFromGoogle) {
      try {
        const res = await fetch(`/api/posts?profileId=${profileId}`);
        if (res.ok) {
          const data = await res.json();
          const localPosts = data.data || [];
          // Filter to only PUBLISHED posts from local DB
          posts = localPosts.filter((p: any) => p.status === "PUBLISHED");
        } else {
          setError("Failed to load posts from Google and Local Database.");
          setLoading(false);
          return;
        }
      } catch (e) {
        setError("Network error. Please try again.");
        setLoading(false);
        return;
      }
    }

    // 3. Filter published posts for the chosen month and year
    const filteredPosts = posts.filter((post: any) => {
      // Determine date property based on source (Google vs Local DB)
      const dateVal = post.createTime || post.publishedAt || post.createdAt;
      if (!dateVal) return false;

      const dateObj = new Date(dateVal);
      const postMonth = dateObj.getMonth();
      const postYear = dateObj.getFullYear();

      // Also verify post state is LIVE/PUBLISHED
      const isLive = post.state ? post.state === "LIVE" : post.status === "PUBLISHED";

      return postMonth === selectedMonth && postYear === selectedYear && isLive;
    });

    // 4. Sort posts by date newest first
    filteredPosts.sort((a, b) => {
      const dateA = new Date(a.createTime || a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.createTime || b.publishedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    // 5. Fetch reviews if checked
    let reviewsHtml = "";
    let filteredReviewsCount = 0;
    if (includeReviews) {
      try {
        const res = await fetch(`/api/profiles/${profileId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          const allReviews = data.data || [];
          
          // Filter reviews for selected month and year
          const filteredReviews = allReviews.filter((r: any) => {
            if (!r.createTime) return false;
            const dateObj = new Date(r.createTime);
            return dateObj.getMonth() === selectedMonth && dateObj.getFullYear() === selectedYear;
          });

          // Sort reviews by date newest first
          filteredReviews.sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
          filteredReviewsCount = filteredReviews.length;

          if (filteredReviews.length > 0) {
            reviewsHtml = filteredReviews.map((r: any) => {
              const reviewDate = new Date(r.createTime).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              });

              // Rating stars mapping
              const starCount = r.starRating === "FIVE" ? 5 : r.starRating === "FOUR" ? 4 : r.starRating === "THREE" ? 3 : r.starRating === "TWO" ? 2 : r.starRating === "ONE" ? 1 : typeof r.starRating === 'number' ? r.starRating : 5;
              const stars = "★".repeat(starCount) + "☆".repeat(5 - starCount);

              // Owner reply
              let replyHtml = "";
              if (r.reviewReply && r.reviewReply.comment) {
                replyHtml = `
                  <div class="review-reply">
                    <p class="reply-title">Owner Response</p>
                    <p>${r.reviewReply.comment}</p>
                  </div>
                `;
              }

              return `
                <div class="review-card page-break">
                  <div class="review-header">
                    <span class="reviewer-name">${r.reviewer?.displayName || "Anonymous"}</span>
                    <span class="review-stars">${stars}</span>
                  </div>
                  <span class="review-date">${reviewDate}</span>
                  <p class="review-comment">"${r.comment || "No comment provided."}"</p>
                  ${replyHtml}
                </div>
              `;
            }).join("");
          }
        }
      } catch (err) {
        console.error("Failed to fetch reviews for report:", err);
      }
    }

    // Check if we have any data to output
    if (filteredPosts.length === 0 && (!includeReviews || filteredReviewsCount === 0)) {
      setError(`No posts or reviews found for ${months[selectedMonth].label} ${selectedYear}.`);
      setLoading(false);
      return;
    }

    // 6. Generate print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Pop-up blocked. Please allow pop-ups for this website to download the report.");
      setLoading(false);
      return;
    }

    // Clean month name & date display details
    const selectedMonthLabel = months[selectedMonth].label;
    const reportDateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    // Generate posts HTML representation
    const postsHtml = filteredPosts
      .map((post: any) => {
        const dateVal = post.createTime || post.publishedAt || post.createdAt;
        const postDateFormatted = new Date(dateVal).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });

        // Determine Image
        let imageUrl = "";
        if (post.media && post.media.length > 0) {
          imageUrl = proxyUrl(post.media[0].googleUrl);
        } else if (post.imageUrl) {
          imageUrl = post.imageUrl;
        }

        // CTA display
        let ctaHtml = "";
        const cta = post.callToAction || (post.ctaType ? { actionType: post.ctaType, url: post.ctaUrl } : null);
        if (cta && cta.actionType && cta.actionType !== "NONE") {
          const ctaLabel = cta.actionType.replace(/_/g, " ");
          ctaHtml = `
            <div class="post-cta">
              <span class="cta-label">${ctaLabel}</span>
            </div>
          `;
        }

        // Handle image placeholder if none
        const imageBlock = imageUrl
          ? `<div class="post-image-container"><img src="${imageUrl}" class="post-image" alt="Post thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="post-image-placeholder" style="display:none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-image"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.11-1.11a2 2 0 0 0-2.83 0L13 19"/></svg></div></div>`
          : `<div class="post-image-container"><div class="post-image-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg></div></div>`;

        return `
          <div class="post-card page-break">
            ${imageBlock}
            <div class="post-card-body">
              <div class="post-card-header">
                <span class="post-date">${postDateFormatted}</span>
                <span class="post-status-badge">Live</span>
              </div>
              <p class="post-description">${post.summary || "No description provided."}</p>
              ${ctaHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // Avatar character for logo fallback
    const logoChar = profileName ? profileName.charAt(0).toUpperCase() : "G";
    const proxiedLogo = logoUrl ? proxyUrl(logoUrl) : "";
    const logoBlock = proxiedLogo
      ? `<img src="${proxiedLogo}" class="logo-image" alt="Profile Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="logo-avatar" style="display:none;">${logoChar}</div>`
      : `<div class="logo-avatar">${logoChar}</div>`;

    // Construct print window HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${profileName} - GMB Update Report (${selectedMonthLabel} ${selectedYear})</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          
          :root {
            --bg-body: #f8fafc;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border-color: #1e293b; /* Charcoal outline for wired box style */
            --border-light: #e2e8f0;
            --primary-color: #2563eb;
            --card-bg: #ffffff;
            --badge-green-bg: #d1fae5;
            --badge-green-text: #065f46;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: var(--text-main);
            background-color: var(--bg-body);
            line-height: 1.5;
            padding-top: 80px; /* space for floating bar */
            padding-bottom: 60px;
          }

          /* Floating controls bar */
          .floating-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 70px;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            z-index: 10000;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
          }

          .floating-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .floating-title {
            font-size: 15px;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
          }

          .floating-subtitle {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
          }

          .floating-actions {
            display: flex;
            gap: 12px;
          }

          .btn-print {
            height: 40px;
            padding: 0 20px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.2s;
          }

          .btn-print:hover {
            background-color: #1d4ed8;
            transform: translateY(-1px);
          }

          .btn-close {
            height: 40px;
            padding: 0 16px;
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-close:hover {
            background-color: rgba(255, 255, 255, 0.15);
          }

          /* Container */
          .report-container {
            max-width: 1020px;
            margin: 0 auto;
            padding: 40px;
            background: var(--card-bg);
            border: 1px solid var(--border-light);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          }

          /* Header */
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px dashed var(--border-light);
            padding-bottom: 30px;
            margin-bottom: 30px;
            gap: 20px;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .logo-container {
            width: 70px;
            height: 70px;
            border-radius: 12px;
            border: 1.5px solid var(--border-light);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background-color: #eff6ff;
            flex-shrink: 0;
          }

          .logo-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .logo-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 700;
            color: var(--primary-color);
            font-family: 'Outfit', sans-serif;
          }

          .header-meta {
            min-width: 0;
          }

          .profile-name {
            font-size: 26px;
            font-weight: 800;
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            line-height: 1.2;
          }

          .report-subtitle {
            font-size: 15px;
            font-weight: 700;
            color: var(--primary-color);
            margin-top: 4px;
            font-family: 'Outfit', sans-serif;
          }

          .profile-address {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .header-right {
            text-align: right;
            flex-shrink: 0;
          }

          /* Statistics */
          .stats-strip {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 35px;
          }

          .stat-card {
            background-color: #fafafa;
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 16px 20px;
            text-align: center;
          }

          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            line-height: 1.1;
          }

          .stat-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 4px;
          }

          /* Grid layout of post cards */
          .posts-grid {
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            column-gap: 20px;
            row-gap: 32px; /* Clear gaps between rows */
          }

          /* Wired border outline card */
          .post-card {
            background: var(--card-bg);
            border: 1.5px solid var(--border-color); /* Charcoal outline */
            border-radius: 8px; /* sharp yet clean border style */
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: none; /* No shadow for wired box style */
          }

          .post-image-container {
            height: 180px; /* Increased height to fit thumbnails correctly */
            width: 100%;
            background: #f8fafc;
            position: relative;
            overflow: hidden;
            border-bottom: 1.5px solid var(--border-color); /* Wire separator line */
            flex-shrink: 0;
          }

          .post-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }

          .post-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #cbd5e1;
            background-color: #f1f5f9;
          }

          .post-card-body {
            padding: 14px; /* Improved padding */
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .post-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .post-date {
            font-size: 10.5px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .post-status-badge {
            font-size: 8px;
            font-weight: 800;
            color: var(--badge-green-text);
            background-color: var(--badge-green-bg);
            padding: 2.5px 7px;
            border-radius: 5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .post-description {
            font-size: 12.5px; /* Improved typography */
            color: #334155;
            line-height: 1.6;
            font-weight: 500;
            /* Clamp description to 2 lines */
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            height: 40px; /* line-height 1.6 * 12.5px * 2 */
            margin: 0;
          }

          .post-cta {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background: #f1f5f9;
            border-radius: 6px;
            width: fit-content;
            margin-top: auto;
          }

          .cta-label {
            font-size: 9px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          /* Reviews styling */
          .reviews-section {
            margin-top: 50px;
            border-top: 2px dashed var(--border-light);
            padding-top: 40px;
          }

          .reviews-title {
            font-size: 20px;
            font-weight: 800;
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            margin-bottom: 24px;
            letter-spacing: -0.01em;
          }

          .reviews-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .review-card {
            background: var(--card-bg);
            border: 1.5px solid var(--border-color); /* Charcoal outline */
            border-radius: 8px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-shadow: none;
          }

          .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }

          .reviewer-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
          }

          .review-stars {
            color: #fbbf24; /* Amber rating stars */
            font-size: 14px;
            letter-spacing: 2px;
          }

          .review-date {
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            font-weight: 600;
          }

          .review-comment {
            font-size: 12.5px;
            color: #475569;
            line-height: 1.6;
            font-style: italic;
            margin-top: 4px;
          }

          .review-reply {
            margin-top: 12px;
            padding: 12px 14px;
            background: #f0fdf4;
            border: 1.5px solid var(--border-color); /* outline structure maintained */
            border-radius: 6px;
            font-size: 12px;
            color: #166534;
            line-height: 1.5;
          }

          .reply-title {
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
            color: #15803d;
          }

          /* Print overrides */
          @media print {
            body {
              padding-top: 0;
              padding-bottom: 0;
              background-color: white;
            }
            .floating-bar {
              display: none;
            }
            .report-container {
              border: none;
              box-shadow: none;
              padding: 0;
              max-width: 100%;
            }
            .page-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .stats-strip {
              margin-bottom: 25px;
            }
            .posts-grid {
              display: grid !important;
              grid-template-columns: repeat(${columns}, 1fr) !important;
              column-gap: 20px !important;
              row-gap: 32px !important;
            }
            .post-card {
              border: 1.5px solid #000 !important;
            }
            .post-image-container {
              border-bottom: 1.5px solid #000 !important;
              height: 180px !important;
            }
            .reviews-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 18px !important;
            }
            .review-card {
              border: 1.5px solid #000 !important;
            }
            .review-reply {
              border: 1.5px solid #000 !important;
            }
          }
        </style>
      </head>
      <body>
        <!-- Floating bar -->
        <div class="floating-bar">
          <div class="floating-info">
            <div class="logo-container" style="width: 38px; height: 38px; border-radius: 8px; margin: 0;">
              ${logoBlock}
            </div>
            <div>
              <p class="floating-title">${profileName}</p>
              <p class="floating-subtitle">${selectedMonthLabel} ${selectedYear} GMB Update Report</p>
            </div>
          </div>
          <div class="floating-actions">
            <button class="btn-close" onclick="window.close()">Close</button>
            <button class="btn-print" onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-down"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
              Save as PDF / Print
            </button>
          </div>
        </div>

        <!-- Report Container -->
        <div class="report-container">
          <!-- Header -->
          <div class="report-header">
            <div class="header-left">
              <div class="logo-container">
                ${logoBlock}
              </div>
              <div class="header-meta">
                <h1 class="profile-name">${profileName}</h1>
                <p class="report-subtitle">${selectedMonthLabel} ${selectedYear} GMB Update Report</p>
                ${address ? `<p class="profile-address">${address}</p>` : ""}
              </div>
            </div>
            <div class="header-right">
              ${brandingText ? `<p class="report-branding" style="font-size: 14px; font-weight: 700; color: var(--text-muted); font-family: 'Outfit', sans-serif;">${brandingText}</p>` : ""}
              ${includeDate ? `<p class="report-generated" style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">Generated: ${reportDateStr}</p>` : ""}
            </div>
          </div>

          <!-- Statistics -->
          <div class="stats-strip">
            <div class="stat-card">
              <p class="stat-value">${filteredPosts.length}</p>
              <p class="stat-label">Published Posts</p>
            </div>
            <div class="stat-card">
              <p class="stat-value">${selectedMonthLabel}</p>
              <p class="stat-label">Report Month</p>
            </div>
            <div class="stat-card">
              <p class="stat-value">${includeReviews ? `${filteredReviewsCount}` : (fetchedFromGoogle ? "Google Feed" : "Local Sync")}</p>
              <p class="stat-label">${includeReviews ? "Reviews Received" : "Data Source"}</p>
            </div>
          </div>

          <!-- Posts Grid -->
          <div class="posts-grid">
            ${postsHtml}
          </div>

          <!-- Reviews Section -->
          ${reviewsHtml ? `
            <div class="reviews-section page-break">
              <h2 class="reviews-title">Customer Reviews & Ratings</h2>
              <div class="reviews-grid">
                ${reviewsHtml}
              </div>
            </div>
          ` : ""}
        </div>

        <script>
          // Autotrigger print dialog after rendering content
          window.focus();
          setTimeout(() => {
            window.print();
          }, 800);
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setLoading(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: 460, borderRadius: 16,
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        overflow: "hidden", display: "flex", flexDirection: "column",
        border: "1px solid #e2e8f0"
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileDown size={18} color="#2563eb" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "inherit" }}>Download Monthly Report</h3>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{profileName}</p>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 500, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Month</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", outline: "none", color: "#334155", fontWeight: 600 }}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Year</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", outline: "none", color: "#334155", fontWeight: 600 }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Columns</label>
              <select
                value={columns}
                onChange={e => setColumns(Number(e.target.value))}
                style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", outline: "none", color: "#334155", fontWeight: 600 }}
              >
                <option value={2}>2 Cols</option>
                <option value={3}>3 Cols</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Branding Label / Managed By</label>
            <input
              type="text"
              placeholder="e.g. Managed by Rankved"
              value={brandingText}
              onChange={e => setBrandingText(e.target.value)}
              style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", outline: "none", color: "#334155" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {/* Custom Checkbox for Date */}
            <label 
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
            >
              <input
                type="checkbox"
                checked={includeDate}
                onChange={e => setIncludeDate(e.target.checked)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
              />
              <div style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: "2px solid",
                borderColor: includeDate ? "#2563eb" : "#cbd5e1",
                backgroundColor: includeDate ? "#2563eb" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0
              }}>
                {includeDate && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12.5, color: "#334155", fontWeight: 600 }}>
                Include Generated Date in Report
              </span>
            </label>

            {/* Custom Checkbox for Reviews */}
            <label 
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
            >
              <input
                type="checkbox"
                checked={includeReviews}
                onChange={e => setIncludeReviews(e.target.checked)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
              />
              <div style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: "2px solid",
                borderColor: includeReviews ? "#2563eb" : "#cbd5e1",
                backgroundColor: includeReviews ? "#2563eb" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0
              }}>
                {includeReviews && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12.5, color: "#334155", fontWeight: 600 }}>
                Include Customer Reviews & Ratings
              </span>
            </label>
          </div>

          <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, margin: 0 }}>
            This will fetch published posts (and optionally reviews) directly from Google for the selected month and format them as cards with thumbnails.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: "8px 16px", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{ padding: "8px 20px", background: "#2563eb", color: "#fff", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 10px rgba(37,99,235,0.2)" }}
          >
            {loading ? <Loader2 size={14} className="anim-spin" /> : <FileDown size={14} />}
            {loading ? "Generating..." : "Download Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
