import nodemailer from "nodemailer";
import prisma from "./prisma";

/**
 * Utility to send email notifications to the admin.
 * Requires SMTP credentials in .env
 */

interface EmailOptions {
  subject: string;
  text: string;
  html?: string;
  to?: string; // Optional override
  cc?: string; // Optional override
}

function parseTemplate(template: string, variables: Record<string, string>) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, "g"), value || "");
  }
  return result;
}

function getPostPreview(summary: string) {
  if (!summary) return "";
  const words = summary.split(/\s+/).filter(Boolean);
  return words.slice(0, 8).join(" ") + (words.length > 8 ? "..." : "");
}

export async function notifyAdmin(opts: EmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Fetch settings from DB
  const settings = await prisma.globalSetting.findUnique({ where: { id: "settings" } });
  const recipientEmails = opts.to || settings?.notificationEmails || process.env.ADMIN_EMAIL || "rankved.business@gmail.com";
  const ccEmails = opts.cc || settings?.notificationCcEmails || "";
  
  const recipients = recipientEmails.split(",").map(e => e.trim()).filter(Boolean);
  const ccs = ccEmails.split(",").map(e => e.trim()).filter(Boolean);

  if (!host || !user || !pass) {
    console.warn("[Notifications] SMTP credentials missing. Skipping email notification.");
    console.info(`[Notifications] [MOCK EMAIL to ${recipientEmails}]: ${opts.subject}\n${opts.text}`);
    return;
  }

  if (recipients.length === 0) return;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"GMB Manager" <${user}>`,
      to: recipients.join(", "),
      ...(ccs.length > 0 ? { cc: ccs.join(", ") } : {}),
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, "<br>"),
    });

    console.log(`[Notifications] Email sent to ${recipients.join(", ")}: ${opts.subject}`);
  } catch (err) {
    console.error("[Notifications] Failed to send email:", err);
  }
}

/**
 * Predefined notification templates with dynamic parsing
 */
export async function getTemplate(type: "SUCCESS" | "FAILURE" | "SCHEDULED", data: any) {
  const settings = await prisma.globalSetting.findUnique({ where: { id: "settings" } });
  
  const variables = {
    profileName: data.profileName || "Unknown Profile",
    postSummary: data.summary || "",
    postPreview: getPostPreview(data.summary || ""),
    error: data.error || "Unknown error",
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toLocaleString() : "Now",
    id: data.id || "",
  };

  let subject = "";
  let body = "";

  if (type === "SUCCESS") {
    subject = settings?.successTemplateSubject || "✅ Post Published: {profileName} - {postPreview}";
    body = settings?.successTemplateBody || "Your post has been published successfully.\n\nProfile: {profileName}\nPost: {postSummary}";
  } else if (type === "FAILURE") {
    subject = settings?.failureTemplateSubject || "⚠️ Post Failed: {profileName}";
    body = settings?.failureTemplateBody || "Your post failed to publish.\n\nProfile: {profileName}\nError: {error}\nPost: {postSummary}";
  } else if (type === "SCHEDULED") {
    subject = settings?.scheduledTemplateSubject || "🕒 Post Scheduled: {profileName}";
    body = settings?.scheduledTemplateBody || "A new post has been scheduled.\n\nProfile: {profileName}\nDate: {scheduledAt}";
  }

  return {
    subject: parseTemplate(subject, variables),
    text: parseTemplate(body, variables).replace(/<[^>]*>?/gm, ''), // strip html for text fallback
    html: parseTemplate(body, variables), // pass full parsed body as HTML
  };
}

// Old templates for backward compatibility or simple usage
export const templates = {
  cronSummary: (processed: number, results: any[]) => {
    const failures = results.filter(r => r.status === "FAILED");
    const successes = results.filter(r => r.status === "PUBLISHED");
    return {
      subject: `📊 Daily Cron Summary: ${successes.length} Published, ${failures.length} Failed`,
      text: `The daily publishing cron job has completed.\n\nTotal Processed: ${processed}\nSuccesses: ${successes.length}\nFailures: ${failures.length}\n\nReview details in the dashboard.`,
    };
  }
};

/**
 * Build a simple review alert email (used externally if needed)
 */
export function buildReviewAlert(opts: {
  profileName: string;
  reviewerName: string;
  starRating: number;
  comment: string;
  replyUrl: string;
}): EmailOptions {
  const stars = "⭐".repeat(Math.min(opts.starRating, 5));
  return {
    subject: `${stars} New ${opts.starRating}-Star Review — ${opts.profileName}`,
    text: `New review on ${opts.profileName}\nFrom: ${opts.reviewerName}\nRating: ${opts.starRating}/5\n\n"${opts.comment}"\n\nReply here: ${opts.replyUrl}`,
  };
}

/**
 * Build a performance spike alert email (used externally if needed)
 */
export function buildPerformanceAlert(opts: {
  profileName: string;
  metricLabel: string;
  prevValue: number;
  currentValue: number;
  changePercent: number;
}): EmailOptions {
  return {
    subject: `📈 ${opts.metricLabel} up ${opts.changePercent}% — ${opts.profileName}`,
    text: `Performance spike on ${opts.profileName}\n${opts.metricLabel}: ${opts.prevValue} → ${opts.currentValue} (+${opts.changePercent}%)\n\nLog in to view your full analytics dashboard.`,
  };
}
