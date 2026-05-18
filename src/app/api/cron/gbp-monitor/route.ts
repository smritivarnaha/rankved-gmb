/**
 * /api/cron/gbp-monitor — GBP Intelligence Monitoring
 *
 * Runs every 6 hours via Vercel Cron.
 * Checks every saved GBP location for:
 *   1. New reviews (detects by comparing stored review IDs)
 *   2. Rating changes (average star rating went up or down)
 *   3. Performance spikes in calls, direction requests, website clicks
 *
 * Sends email alerts via the notifyAdmin utility.
 */

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getValidGoogleAccounts } from "@/lib/google-accounts";
import { notifyAdmin } from "@/lib/notifications";

export const maxDuration = 60;

// ── Helpers ──────────────────────────────────────────────────────────────

function starEmoji(rating: number) {
  const stars = Math.round(rating);
  return "⭐".repeat(Math.min(stars, 5));
}

function percentChange(old: number, current: number): number {
  if (old === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - old) / old) * 100);
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 && i < retries) {
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

// ── Main Handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.globalSetting.findUnique({ where: { id: "settings" } });

  if (!settings?.monitoringEnabled) {
    return NextResponse.json({ message: "GBP monitoring is disabled" });
  }

  // Fetch all locations with their client (we need gbpAccountId + gbpLocationId)
  const locations = await prisma.location.findMany({
    include: { client: { include: { user: true } } },
  });

  if (locations.length === 0) {
    return NextResponse.json({ message: "No locations to monitor", checked: 0 });
  }

  const alertsSent: string[] = [];
  const errors: string[] = [];

  for (const location of locations) {
    try {
      // Get the best access token for this location's owner
      const userId = location.client.userId;
      const accounts = await getValidGoogleAccounts(userId);
      const accessToken = accounts[0]?.access_token;

      if (!accessToken) {
        console.warn(`[GBP Monitor] No token for location ${location.name} (userId: ${userId})`);
        continue;
      }

      const locationPath = `${location.gbpAccountId}/${location.gbpLocationId}`;

      // ── 1. Review Monitoring ─────────────────────────────────────────────
      if (settings.reviewAlertsEnabled) {
        await checkReviews({ location, locationPath, accessToken, settings, alertsSent });
      }

      // ── 2. Performance Monitoring ────────────────────────────────────────
      if (settings.performanceAlertsEnabled) {
        await checkPerformance({ location, locationPath, accessToken, settings, alertsSent });
      }

      // Small delay to avoid API rate limits
      await new Promise(r => setTimeout(r, 300));

    } catch (err: any) {
      console.error(`[GBP Monitor] Error for ${location.name}:`, err.message);
      errors.push(`${location.name}: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: "GBP monitor completed",
    locationsChecked: locations.length,
    alertsSent: alertsSent.length,
    alerts: alertsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ── Review Checker ────────────────────────────────────────────────────────

async function checkReviews({ location, locationPath, accessToken, settings, alertsSent }: {
  location: any;
  locationPath: string;
  accessToken: string;
  settings: any;
  alertsSent: string[];
}) {
  const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=10`;

  const res = await fetchWithRetry(reviewsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.warn(`[GBP Monitor] Reviews API failed for ${location.name}: ${res.status}`);
    return;
  }

  const data = await res.json();
  const reviews: any[] = data.reviews || [];
  const totalCount: number = data.totalReviewCount ?? reviews.length;
  const avgRating: number = data.averageRating ?? 0;

  // Get or create snapshot
  const snapshot = await prisma.reviewSnapshot.upsert({
    where: { locationId: location.id },
    update: {},
    create: {
      locationId: location.id,
      totalReviewCount: totalCount,
      averageRating: avgRating,
      lastReviewIds: JSON.stringify(reviews.map((r: any) => r.reviewId)),
    },
  });

  const seenIds: string[] = (() => {
    try { return JSON.parse(snapshot.lastReviewIds || "[]"); }
    catch { return []; }
  })();

  // Detect NEW reviews (reviews not in our last snapshot)
  const newReviews = reviews.filter((r: any) => !seenIds.includes(r.reviewId));

  for (const review of newReviews) {
    const reviewer = review.reviewer?.displayName || "Anonymous";
    const starRating = review.starRating || "UNKNOWN";
    const starNumber = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[starRating as string] ?? 0;
    const comment = review.comment || "(No text left)";
    const profileUrl = `https://gmb.rankved.com/reviews?profileId=${location.id}`;

    const subject = `${starEmoji(starNumber)} New ${starNumber}-Star Review — ${location.name}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 28px 32px;">
          <p style="margin:0; font-size: 13px; color: rgba(255,255,255,0.75); letter-spacing: 0.5px; text-transform: uppercase;">GBP Intelligence</p>
          <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #fff;">New Review Received</h1>
        </div>
        <div style="padding: 28px 32px;">
          <p style="margin: 0 0 6px; font-size: 14px; color: #64748b;">Business Profile</p>
          <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827;">${location.name}</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 40px; height: 40px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #2563eb;">
                ${reviewer.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">${reviewer}</p>
                <p style="margin: 2px 0 0; font-size: 18px;">${starEmoji(starNumber)} <span style="font-size: 13px; color: #64748b;">${starNumber}/5 stars</span></p>
              </div>
            </div>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; font-style: italic;">"${comment}"</p>
          </div>
          
          <a href="${profileUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            View & Reply to Review →
          </a>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid #f1f5f9; background: #fafafa;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sent by GMB Manager — RankVed Intelligence Alerts</p>
        </div>
      </div>
    `;

    await notifyAdmin({
      subject,
      text: `New ${starNumber}-star review on ${location.name} from ${reviewer}:\n"${comment}"\n\nView & reply: ${profileUrl}`,
      html,
    });

    alertsSent.push(`New review on ${location.name} from ${reviewer} (${starNumber}★)`);
    console.log(`[GBP Monitor] New review alert sent for ${location.name}`);
  }

  // Detect rating change (up or down)
  if (snapshot.totalReviewCount > 0 && Math.abs(avgRating - snapshot.averageRating) >= 0.1) {
    const direction = avgRating > snapshot.averageRating ? "📈 improved" : "📉 dropped";
    const subject = `${avgRating > snapshot.averageRating ? "📈" : "📉"} Rating ${direction} — ${location.name}`;

    await notifyAdmin({
      subject,
      text: `Rating change on ${location.name}.\nPrevious: ${snapshot.averageRating.toFixed(1)}★\nNew: ${avgRating.toFixed(1)}★\nTotal reviews: ${totalCount}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: ${avgRating > snapshot.averageRating ? "linear-gradient(135deg, #047857 0%, #10b981 100%)" : "linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)"}; padding: 28px 32px;">
            <p style="margin:0; font-size: 13px; color: rgba(255,255,255,0.75);">GBP Intelligence</p>
            <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #fff;">Rating ${direction.charAt(0).toUpperCase() + direction.slice(1)}</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="font-size: 18px; font-weight: 700; color: #111827;">${location.name}</p>
            <div style="display: flex; gap: 32px; margin: 24px 0;">
              <div style="text-align: center; padding: 16px 24px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase;">Before</p>
                <p style="margin: 0; font-size: 28px; font-weight: 800; color: #111827;">${snapshot.averageRating.toFixed(1)}★</p>
              </div>
              <div style="text-align: center; padding: 16px 24px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase;">Now</p>
                <p style="margin: 0; font-size: 28px; font-weight: 800; color: ${avgRating > snapshot.averageRating ? "#059669" : "#dc2626"};">${avgRating.toFixed(1)}★</p>
              </div>
              <div style="text-align: center; padding: 16px 24px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase;">Total Reviews</p>
                <p style="margin: 0; font-size: 28px; font-weight: 800; color: #111827;">${totalCount}</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });
    alertsSent.push(`Rating change on ${location.name}: ${snapshot.averageRating.toFixed(1)}→${avgRating.toFixed(1)}★`);
  }

  // Update snapshot with new data
  await prisma.reviewSnapshot.update({
    where: { locationId: location.id },
    data: {
      totalReviewCount: totalCount,
      averageRating: avgRating,
      lastReviewIds: JSON.stringify(reviews.map((r: any) => r.reviewId)),
      lastCheckedAt: new Date(),
    },
  });
}

// ── Performance Checker ───────────────────────────────────────────────────

async function checkPerformance({ location, locationPath, accessToken, settings, alertsSent }: {
  location: any;
  locationPath: string;
  accessToken: string;
  settings: any;
  alertsSent: string[];
}) {
  // Business Profile Performance API — fetch last 7 days of metrics
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Using the Business Profile Performance API
  const perfUrl = `https://businessprofileperformance.googleapis.com/v1/${locationPath}:fetchMultiDailyMetricsTimeSeries?` +
    `dailyMetric=CALL_CLICKS&dailyMetric=WEBSITE_CLICKS&dailyMetric=BUSINESS_DIRECTION_REQUESTS` +
    `&dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}` +
    `&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}`;

  const res = await fetchWithRetry(perfUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`[GBP Monitor] Performance API failed for ${location.name}: ${res.status} - ${err.substring(0, 200)}`);
    return;
  }

  const data = await res.json();
  const multiTimeSeries = data.multiDailyMetricTimeSeries || [];

  // Sum up totals for each metric this week
  const totals: Record<string, number> = { CALL_CLICKS: 0, WEBSITE_CLICKS: 0, BUSINESS_DIRECTION_REQUESTS: 0 };

  for (const series of multiTimeSeries) {
    const metricName: string = series.dailyMetric;
    const dts = series.dailyMetricTimeSeries?.dailySubEntityData || series.dailyMetricTimeSeries?.timeSeries?.datedValues || [];
    for (const point of dts) {
      totals[metricName] = (totals[metricName] || 0) + (parseInt(point.value ?? "0", 10) || 0);
    }
  }

  const snapshot = await prisma.reviewSnapshot.findUnique({ where: { locationId: location.id } });
  if (!snapshot) return; // snapshot should exist from review check above; skip if not

  // Check each metric for spikes
  const checks = [
    { key: "CALL_CLICKS", label: "📞 Phone Calls", prev: snapshot.lastCallCount, threshold: settings.callsSpikeThreshold },
    { key: "BUSINESS_DIRECTION_REQUESTS", label: "📍 Direction Requests", prev: snapshot.lastDirectionCount, threshold: settings.directionsSpikeThreshold },
    { key: "WEBSITE_CLICKS", label: "🌐 Website Clicks", prev: snapshot.lastClickCount, threshold: settings.clicksSpikeThreshold },
  ];

  for (const check of checks) {
    const current = totals[check.key] || 0;
    const pct = percentChange(check.prev, current);

    // Only alert on first check (prev=0) if numbers are meaningful, or on real spikes
    if (check.prev === 0 && current < 5) continue;
    if (pct < check.threshold) continue;

    const profileUrl = `https://gmb.rankved.com/performance`;
    const subject = `${check.label} up ${pct}% — ${location.name}`;

    await notifyAdmin({
      subject,
      text: `${check.label} spike detected on ${location.name}!\n\nThis week: ${current}\nLast week: ${check.prev}\nChange: +${pct}%\n\nView analytics: ${profileUrl}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #047857 0%, #10b981 100%); padding: 28px 32px;">
            <p style="margin:0; font-size: 13px; color: rgba(255,255,255,0.75);">GBP Intelligence • Performance Alert</p>
            <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #fff;">${check.label} Spike Detected! 🚀</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827;">${location.name}</p>
            <div style="display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Last Week</p>
                <p style="margin: 0; font-size: 32px; font-weight: 800; color: #6b7280;">${check.prev}</p>
              </div>
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 20px; background: #ecfdf5; border-radius: 10px; border: 2px solid #a7f3d0;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">This Week</p>
                <p style="margin: 0; font-size: 32px; font-weight: 800; color: #059669;">${current}</p>
              </div>
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 20px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px;">Growth</p>
                <p style="margin: 0; font-size: 32px; font-weight: 800; color: #2563eb;">+${pct}%</p>
              </div>
            </div>
            <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
              Great momentum! Keep it going by publishing a fresh post to capitalize on this growth. 🎯
            </p>
            <a href="${profileUrl}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              View Full Analytics →
            </a>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid #f1f5f9; background: #fafafa;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sent by GMB Manager — RankVed Intelligence Alerts</p>
          </div>
        </div>
      `,
    });

    alertsSent.push(`${check.label} up ${pct}% on ${location.name} (${check.prev}→${current})`);
    console.log(`[GBP Monitor] Performance alert: ${check.label} on ${location.name} +${pct}%`);
  }

  // Update baseline metrics in snapshot
  await prisma.reviewSnapshot.update({
    where: { locationId: location.id },
    data: {
      lastCallCount: totals["CALL_CLICKS"] || 0,
      lastDirectionCount: totals["BUSINESS_DIRECTION_REQUESTS"] || 0,
      lastClickCount: totals["WEBSITE_CLICKS"] || 0,
    },
  });
}
