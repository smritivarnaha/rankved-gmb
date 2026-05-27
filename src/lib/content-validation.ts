/**
 * Utility to scan post summaries for prohibited content like phone numbers, URLs, and email addresses.
 * Useful for flagging posts prior to publishing/scheduling.
 */
export function checkProhibitedContent(text?: string | null): string[] {
  if (!text) return [];
  const issues: string[] = [];

  // 1. Phone number check (looks for 10-digit numbers, formatted numbers, or sequences with spaces/dashes)
  // We match general phone numbers while filtering out years (like 2024, 2025, 2026) and postal codes.
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b|\b\d{5}\s\d{5}\b/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    const genuinePhones = phoneMatches.filter(m => {
      const digits = m.replace(/\D/g, "");
      // Exclude common year combinations and standard year patterns
      return digits.length >= 8 && digits.length <= 15 && !["2024", "2025", "2026"].includes(digits);
    });
    if (genuinePhones.length > 0) {
      issues.push(`Phone number: "${genuinePhones[0]}"`);
    }
  }

  // 2. Email check
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches) {
    issues.push(`Email address: "${emailMatches[0]}"`);
  }

  // 3. Website/URL check
  const urlRegex = /\b(?:https?:\/\/|www\.)[^\s()<>]+|\b[A-Za-z0-9.-]+\.(?:com|in|org|net|co|info|biz)\b/gi;
  const urlMatches = text.match(urlRegex);
  if (urlMatches) {
    // Filter out false positives
    const genuineUrls = urlMatches.filter(m => {
      const lower = m.toLowerCase();
      return !lower.includes("pgi") && !lower.includes("md") && !lower.includes("dm") && !lower.endsWith(".jpg") && !lower.endsWith(".png");
    });
    if (genuineUrls.length > 0) {
      issues.push(`Website link: "${genuineUrls[0]}"`);
    }
  }

  return issues;
}
