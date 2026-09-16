/**
 * review-templates.ts
 *
 * Comprehensive Library of 15 Unique, Dynamic Google Review Reply Templates
 * Tier 1: 1-2 Stars (Low / Critical Reviews) — 5 Templates (Calm, empathetic, professional, private profile contact)
 * Tier 2: 3 Stars (Neutral / Constructive Reviews) — 4 Templates (Balanced, improvement-focused, SEO blended)
 * Tier 3: 4-5 Stars (High / Positive Reviews) — 6 Templates (Grateful, warm, treatment & consultation focused, SEO blended)
 *
 * Dynamic Placeholders:
 * - {{reviewerName}} : Full name of reviewer (or smoothly omitted if anonymous)
 * - {{firstName}}    : First name of reviewer (or smoothly omitted if anonymous)
 * - {{businessName}} : Practice / Clinic / Business Name
 * - {{cityOrArea}}    : City or locality
 * - {{targetKeyword}} : Primary Search & Specialty Keyword (e.g. "neurologist in Mohali")
 *
 * Rules:
 * 1. NEVER print raw phone numbers or raw email addresses. Always guide the patient to "the contact number listed on our business profile".
 * 2. NEVER use generic "Patient" or "Valued Patient" or "there" as fallback names. Use natural name greetings when available and elegant clean openers when anonymous.
 * 3. Every single template has a unique, distinct opening style.
 */

export interface ReviewTemplate {
  id: string;
  title: string;
  tier: "LOW" | "NEUTRAL" | "HIGH"; // LOW (1-2★), NEUTRAL (3★), HIGH (4-5★)
  minRating: number;
  maxRating: number;
  category: string;
  description: string;
  template: string;
}

export const REVIEW_TEMPLATES: ReviewTemplate[] = [
  // ─── TIER 1: 1-2 STARS (LOW / CRITICAL REVIEWS - 5 TEMPLATES) ─────────────
  {
    id: "low_resolution_direct",
    title: "Direct Responsibility & Case Review",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "General Dissatisfaction",
    description: "Empathetic acknowledgment taking full clinical responsibility and inviting direct connection via profile number.",
    template: "Hello {{firstName}}, we take your feedback very seriously and sincerely apologize that your experience at {{businessName}} did not meet our high standards. Providing attentive clinical care and patient comfort is our daily commitment. We would appreciate the opportunity to review your case and resolve this with you directly. Kindly connect with us on the contact number attached to our business profile so our management team can assist you personally."
  },
  {
    id: "low_wait_time",
    title: "Wait Time & Scheduling Empathy",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Wait Times / Delays",
    description: "Addresses wait time concerns with empathy while explaining clinical thoroughness and active scheduling optimization.",
    template: "Thank you for sharing your feedback, {{reviewerName}}. We apologize for the delay you experienced during your visit to {{businessName}}. While our doctors strive to give every consultation the thorough time and detailed explanation it requires, we understand your time is valuable and we are actively optimizing our patient flow. Please reach out to us using the contact number listed on our Google profile so we can assist you directly."
  },
  {
    id: "low_communication_clarity",
    title: "Consultation & Communication Assurance",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Communication & Guidance",
    description: "Reassures regarding doctor communication, clear medical explanations, and attentive bedside manner.",
    template: "Dear {{firstName}}, we are truly sorry to hear that your visit did not reflect the clear and attentive communication our practice strives for. Detailed medical explanations and compassionate guidance are central to our work at {{businessName}}. We want to understand what happened and ensure your concerns are thoroughly addressed. Kindly call or connect with us on the number provided on our business profile at your convenience."
  },
  {
    id: "low_rating_only",
    title: "Star-Only Dissatisfaction Inquiry",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Rating Only",
    description: "Proactive, dignified inquiry when a user leaves 1-2 stars without written explanation.",
    template: "Greetings {{reviewerName}}, thank you for rating {{businessName}}. We are concerned to see that your visit fell short of the 5-star standard we strive to deliver. As a dedicated {{targetKeyword}}, our entire team is committed to continuous improvement and attentive patient care. We would value hearing more about your experience, please reach out to our team using the contact number listed on our business profile."
  },
  {
    id: "low_admin_service",
    title: "Front Desk & Coordination Recovery",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Staff / Administration",
    description: "Apologizes for front desk, reception, or coordination hiccups with a prompt profile resolution route.",
    template: "Hi {{firstName}}, thank you for bringing this to our attention. We sincerely apologize for any coordination issues or frustration during your recent visit to {{businessName}}. Delivering a respectful, smooth patient experience from reception to consultation is our highest priority. We would like to address this issue directly with you. Kindly connect with us through the phone number attached to our business profile."
  },

  // ─── TIER 2: 3 STARS (NEUTRAL / CONSTRUCTIVE REVIEWS - 4 TEMPLATES) ────────
  {
    id: "neutral_balanced_care",
    title: "Constructive Feedback & Continuous Care",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Balanced Feedback",
    description: "Constructive appreciation highlighting clinical standards and natural SEO keywords.",
    template: "Thank you for sharing your balanced perspective, {{reviewerName}}. At {{businessName}}, our team constantly works to combine thorough diagnostic care with a comfortable patient experience. We appreciate your observations and are using them to refine our daily services. As a trusted {{targetKeyword}}, we remain dedicated to supporting your ongoing health and well-being."
  },
  {
    id: "neutral_patient_experience",
    title: "Attentive Service Elevation",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Service Follow-up",
    description: "Warm invitation for suggestions to elevate 3-star visits to 5-star clinical standard.",
    template: "Hello {{firstName}}, we appreciate you taking the time to review {{businessName}}. Your feedback helps our entire clinical team uphold high standards of care and clear medical communication. If there is anything specific we can do to make your next visit a 5-star experience, please feel free to reach out via the contact number listed on our business profile. We wish you good health."
  },
  {
    id: "neutral_concise_thanks",
    title: "Direct Professional Appreciation",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Concise Focus",
    description: "Direct, professional reply reinforcing practice expertise and constructive care.",
    template: "Dear {{reviewerName}}, we have carefully noted your constructive feedback. Providing attentive clinical guidance and personalized care as a trusted {{targetKeyword}} is the daily focus of our team at {{businessName}}. We appreciate your review and look forward to serving you with even greater excellence during your next consultation."
  },
  {
    id: "neutral_consultation_focus",
    title: "Clinical Quality & Patient Comfort",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Clinical Care",
    description: "Reaffirms commitment to transparent care and thorough consultation.",
    template: "Hi {{firstName}}, thank you for sharing your thoughts regarding your visit to {{businessName}}. Our medical team is dedicated to providing comprehensive consultations, transparent advice, and dependable patient support. We value your input and will continue working hard to make every visit seamless. Thank you for your trust in our practice."
  },

  // ─── TIER 3: 4-5 STARS (HIGH / POSITIVE REVIEWS - 6 TEMPLATES) ────────────
  {
    id: "high_warm_doctor_guidance",
    title: "Doctor Consultation & Compassionate Care",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Doctor Guidance",
    description: "Warm appreciation focusing on clear doctor consultation, guidance, and patient reassurance.",
    template: "Hello {{firstName}}, thank you so much for your kind words and 5-star review of {{businessName}}. Our team is delighted to know that you felt well-guided and comfortable during your consultation. As a dedicated {{targetKeyword}}, we are committed to providing personalized treatment and thorough care for every patient. We wish you continued good health!"
  },
  {
    id: "high_staff_and_clinic",
    title: "Team Coordination & Clinical Excellence",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Team & Atmosphere",
    description: "Celebrates full team coordination, supportive clinic atmosphere, and local authority.",
    template: "Thank you for your wonderful review, {{reviewerName}}! Our entire staff and clinical team at {{businessName}} strive to make every visit as comfortable, reassuring, and thorough as possible. We are grateful for your recommendation and are honored to serve our community as a trusted {{targetKeyword}}. Please take care and stay healthy!"
  },
  {
    id: "high_short_direct",
    title: "Concise & Direct Appreciation",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Short & Direct",
    description: "Impactful thank-you focusing on prompt service, medical guidance, and trust.",
    template: "Dear {{reviewerName}}, we truly appreciate your generous 5-star rating and trust in {{businessName}}. Delivering attentive patient care, clear medical guidance, and prompt service is always our team's highest priority. We look forward to continuing to assist you and wish you great health and happiness."
  },
  {
    id: "high_seo_authority",
    title: "Specialty & Location Authority Focus",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "SEO Authority",
    description: "Positions the clinic as the leading medical authority with seamless keyword blend.",
    template: "Greetings {{firstName}}, thank you for taking the time to share your positive review of {{businessName}}. As a leading {{targetKeyword}}, our team is deeply committed to combining clinical excellence with attentive, empathetic patient support. Your kind feedback motivates our entire staff to keep delivering top-quality care. We wish you wonderful health and well-being."
  },
  {
    id: "high_consultation_recovery",
    title: "Treatment Outcome & Patient Recovery",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Treatment Outcome",
    description: "Focuses on successful clinical outcomes, thorough recovery, and ongoing support.",
    template: "Hi {{reviewerName}}, thank you so much for your heartfelt feedback! It is truly rewarding for our team at {{businessName}} to know that your consultation and treatment went smoothly. Ensuring clear explanations and long-term patient recovery is at the heart of what we do. We are always here whenever you need medical guidance."
  },
  {
    id: "high_family_trust",
    title: "Long-term Trust & Practice Recommendation",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Family & Community",
    description: "Emphasizes multi-generational patient trust, welcoming environment, and ongoing care.",
    template: "Dear {{firstName}}, we are truly grateful for your kind review and trust in {{businessName}}. Providing a welcoming atmosphere, transparent medical guidance, and reliable {{targetKeyword}} services is what our practice strives for every single day. Thank you for choosing our clinic, and we wish you and your family excellent health."
  }
];

export interface RenderTemplateParams {
  template: string | ReviewTemplate;
  reviewerName?: string | null;
  businessName?: string | null;
  cityOrArea?: string | null;
  targetKeyword?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

/**
 * Extracts a clean first name from full name (preserving honorifics like Dr., Mr.) or returns empty string if anonymous
 */
export function extractFirstName(fullName?: string | null): string {
  if (!fullName) return "";
  const clean = fullName.trim();
  if (
    !clean ||
    clean.toLowerCase().includes("google user") ||
    clean.toLowerCase().includes("anonymous") ||
    clean.toLowerCase().includes("patient") ||
    clean.toLowerCase() === "user"
  ) {
    return "";
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  const titles = ["dr.", "dr", "mr.", "mr", "mrs.", "mrs", "ms.", "ms", "prof.", "prof", "shri", "smt"];
  if (parts.length > 1 && titles.includes(parts[0].toLowerCase())) {
    const title = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const firstName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    return `${title} ${firstName}`;
  }
  const first = parts[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Extracts a clean full name or returns empty string if anonymous
 */
export function extractValidFullName(fullName?: string | null): string {
  if (!fullName) return "";
  const clean = fullName.trim();
  if (
    !clean ||
    clean.toLowerCase().includes("google user") ||
    clean.toLowerCase().includes("anonymous") ||
    clean.toLowerCase().includes("patient") ||
    clean.toLowerCase() === "user"
  ) {
    return "";
  }
  return clean;
}

/**
 * Renders a dynamic review template with all parameters interpolated cleanly.
 * Handles both named reviewers and anonymous reviews seamlessly without ever outputting "Patient".
 */
export function renderReviewTemplate(params: RenderTemplateParams): string {
  const rawTemplate = typeof params.template === "string" ? params.template : params.template.template;
  
  const validFullName = extractValidFullName(params.reviewerName);
  const firstName = extractFirstName(params.reviewerName);
  const businessName = params.businessName?.trim() || "our clinic";
  const cityOrArea = params.cityOrArea?.trim() || "";
  
  let targetKeyword = params.targetKeyword?.trim() || "healthcare provider";
  if (cityOrArea && !targetKeyword.toLowerCase().includes(cityOrArea.toLowerCase())) {
    targetKeyword = `${targetKeyword} in ${cityOrArea}`;
  }

  let rendered = rawTemplate;

  if (validFullName || firstName) {
    // When a valid name is available
    rendered = rendered
      .replace(/\{\{reviewerName\}\}/g, validFullName || firstName)
      .replace(/\{\{firstName\}\}/g, firstName || validFullName);
  } else {
    // When anonymous / no valid name, smoothly adjust greetings without awkward words
    rendered = rendered
      .replace(/Hello \{\{firstName\}\},\s*/gi, "Hello, ")
      .replace(/Dear \{\{firstName\}\},\s*/gi, "Hello, ")
      .replace(/Hi \{\{firstName\}\},\s*/gi, "Hi, ")
      .replace(/Greetings \{\{firstName\}\},\s*/gi, "Greetings, ")
      .replace(/Hello \{\{reviewerName\}\},\s*/gi, "Hello, ")
      .replace(/Dear \{\{reviewerName\}\},\s*/gi, "Hello, ")
      .replace(/Hi \{\{reviewerName\}\},\s*/gi, "Hi, ")
      .replace(/Greetings \{\{reviewerName\}\},\s*/gi, "Greetings, ")
      .replace(/,\s*\{\{reviewerName\}\}!/gi, "!")
      .replace(/,\s*\{\{reviewerName\}\}\./gi, ".")
      .replace(/,\s*\{\{reviewerName\}\}/gi, "")
      .replace(/,\s*\{\{firstName\}\}!/gi, "!")
      .replace(/,\s*\{\{firstName\}\}\./gi, ".")
      .replace(/,\s*\{\{firstName\}\}/gi, "")
      .replace(/\{\{reviewerName\}\}/g, "")
      .replace(/\{\{firstName\}\}/g, "");
  }

  rendered = rendered
    .replace(/\{\{businessName\}\}/g, businessName)
    .replace(/\{\{cityOrArea\}\}/g, cityOrArea)
    .replace(/\{\{targetKeyword\}\}/g, targetKeyword);

  // Clean up punctuation, trailing spaces, double commas
  rendered = rendered
    .replace(/["“”]/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();

  return rendered;
}

/**
 * Smartly selects the most contextually relevant template among the 15 based on:
 * - Star rating (1-2★ vs 3★ vs 4-5★)
 * - Review text content (wait times, doctor guidance, staff, billing, rating only)
 */
export function selectSmartReviewTemplate(
  rating: number,
  reviewText?: string | null
): ReviewTemplate {
  const text = (reviewText || "").toLowerCase().trim();
  const isRatingOnly = text.length === 0;

  // Tier 1: 1-2 Stars (Low)
  if (rating <= 2) {
    if (isRatingOnly) {
      return REVIEW_TEMPLATES.find(t => t.id === "low_rating_only") || REVIEW_TEMPLATES[0];
    }
    if (text.includes("wait") || text.includes("time") || text.includes("delay") || text.includes("late") || text.includes("queue")) {
      return REVIEW_TEMPLATES.find(t => t.id === "low_wait_time") || REVIEW_TEMPLATES[1];
    }
    if (text.includes("staff") || text.includes("reception") || text.includes("behavior") || text.includes("rude") || text.includes("money") || text.includes("bill")) {
      return REVIEW_TEMPLATES.find(t => t.id === "low_admin_service") || REVIEW_TEMPLATES[4];
    }
    if (text.includes("doctor") || text.includes("explain") || text.includes("listen") || text.includes("talk") || text.includes("consult")) {
      return REVIEW_TEMPLATES.find(t => t.id === "low_communication_clarity") || REVIEW_TEMPLATES[2];
    }
    return REVIEW_TEMPLATES.find(t => t.id === "low_resolution_direct") || REVIEW_TEMPLATES[0];
  }

  // Tier 2: 3 Stars (Neutral)
  if (rating === 3) {
    if (text.includes("average") || text.includes("moderate") || text.includes("fair") || text.includes("overall")) {
      return REVIEW_TEMPLATES.find(t => t.id === "neutral_patient_experience") || REVIEW_TEMPLATES[6];
    }
    if (text.includes("doctor") || text.includes("dr") || text.includes("consult") || text.includes("treatment") || text.includes("medicine") || text.includes("advice")) {
      return REVIEW_TEMPLATES.find(t => t.id === "neutral_consultation_focus") || REVIEW_TEMPLATES[8];
    }
    if (text.length < 20) {
      return REVIEW_TEMPLATES.find(t => t.id === "neutral_concise_thanks") || REVIEW_TEMPLATES[7];
    }
    return REVIEW_TEMPLATES.find(t => t.id === "neutral_balanced_care") || REVIEW_TEMPLATES[5];
  }

  // Tier 3: 4-5 Stars (High)
  if (text.includes("family") || text.includes("mother") || text.includes("father") || text.includes("parent") || text.includes("recommend") || text.includes("relative")) {
    return REVIEW_TEMPLATES.find(t => t.id === "high_family_trust") || REVIEW_TEMPLATES[14];
  }
  if (text.includes("recover") || text.includes("surgery") || text.includes("result") || text.includes("cure") || text.includes("relief") || text.includes("pain") || text.includes("healed")) {
    return REVIEW_TEMPLATES.find(t => t.id === "high_consultation_recovery") || REVIEW_TEMPLATES[13];
  }
  if (text.includes("doctor") || text.includes("dr") || text.includes("explain") || text.includes("guid") || text.includes("knowledge") || text.includes("diagnos")) {
    return REVIEW_TEMPLATES.find(t => t.id === "high_warm_doctor_guidance") || REVIEW_TEMPLATES[9];
  }
  if (text.includes("staff") || text.includes("nurse") || text.includes("team") || text.includes("clean") || text.includes("friendly") || text.includes("cooperat")) {
    return REVIEW_TEMPLATES.find(t => t.id === "high_staff_and_clinic") || REVIEW_TEMPLATES[10];
  }
  if (text.length < 25) {
    return REVIEW_TEMPLATES.find(t => t.id === "high_short_direct") || REVIEW_TEMPLATES[11];
  }

  return REVIEW_TEMPLATES.find(t => t.id === "high_seo_authority") || REVIEW_TEMPLATES[12];
}
