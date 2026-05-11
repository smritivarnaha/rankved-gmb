import nodemailer from "nodemailer";

/**
 * Utility to send email notifications to the admin.
 * Requires SMTP credentials in .env:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASS
 * - ADMIN_EMAIL (defaults to rankved.business@gmail.com)
 */

interface EmailOptions {
  subject: string;
  text: string;
  html?: string;
}

export async function notifyAdmin(opts: EmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || "rankved.business@gmail.com";

  if (!host || !user || !pass) {
    console.warn("[Notifications] SMTP credentials missing. Skipping email notification.");
    console.info(`[Notifications] [MOCK EMAIL to ${adminEmail}]: ${opts.subject}\n${opts.text}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"GMB Manager" <${user}>`,
      to: adminEmail,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, "<br>"),
    });

    console.log(`[Notifications] Email sent to ${adminEmail}: ${opts.subject}`);
  } catch (err) {
    console.error("[Notifications] Failed to send email:", err);
  }
}

/**
 * Predefined notification templates
 */
export const templates = {
  postFailed: (post: any, error: string) => ({
    subject: `⚠️ Post Failed: ${post.profileName || "Unknown Profile"}`,
    text: `The following post failed to publish to Google Business Profile.\n\nPost ID: ${post.id}\nProfile: ${post.profileName}\nError: ${error}\n\nSummary:\n${post.summary?.substring(0, 200)}...`,
  }),
  postPublished: (post: any) => ({
    subject: `✅ Post Published: ${post.profileName || "Unknown Profile"}`,
    text: `A post has been successfully published to Google Business Profile.\n\nPost ID: ${post.id}\nProfile: ${post.profileName}\n\nSummary:\n${post.summary?.substring(0, 200)}...`,
  }),
  postScheduled: (post: any) => ({
    subject: `🕒 Post Scheduled: ${post.profileName || "Unknown Profile"}`,
    text: `A new post has been scheduled for publication.\n\nPost ID: ${post.id}\nProfile: ${post.profileName}\nScheduled For: ${post.scheduledAt}\n\nSummary:\n${post.summary?.substring(0, 200)}...`,
  }),
  cronSummary: (processed: number, results: any[]) => {
    const failures = results.filter(r => r.status === "FAILED");
    const successes = results.filter(r => r.status === "PUBLISHED");
    return {
      subject: `📊 Daily Cron Summary: ${successes.length} Published, ${failures.length} Failed`,
      text: `The daily publishing cron job has completed.\n\nTotal Processed: ${processed}\nSuccesses: ${successes.length}\nFailures: ${failures.length}\n\nReview details in the dashboard.`,
    };
  }
};
