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
  doctorTemplate: string;
}

/**
 * Normalizes a business or doctor name so individual doctors (especially Dr. Sheerin Shah)
 * never include "Clinic" or long SEO suffixes in review replies.
 */
export function normalizeBusinessName(rawName?: string | null): string {
  if (!rawName) return "our practice";
  const trimmed = rawName.trim();
  if (!trimmed) return "our practice";

  // Explicit rule for Dr. Sheerin Shah: never use "Clinic" or long professor/specialty suffixes
  if (/sheerin/i.test(trimmed)) {
    return "Dr. Sheerin Shah";
  }

  // If it's an individual doctor GMB title with SEO suffixes (commas, parentheses, pipes, "Best ...")
  if (/^(dr\.?|prof\.?)\s+/i.test(trimmed) && !/\b(clinic|hospital|centre|center|institute)\b/i.test(trimmed.split(/[,(|-]/)[0])) {
    const basePart = trimmed
      .split(/[,(|-]/)[0]
      .replace(/\b(best|top|leading)\b.*$/i, "")
      .trim();
    if (basePart.length >= 5) {
      return basePart;
    }
  }

  return trimmed;
}

/**
 * Detects whether a profile / brand name represents an individual doctor (like Dr. Sheerin Shah)
 * rather than a multi-doctor hospital or clinic.
 */
export function isIndividualDoctorProfile(rawName?: string | null): boolean {
  if (!rawName) return false;
  if (/sheerin/i.test(rawName)) return true;
  const normalized = normalizeBusinessName(rawName);
  return /^(dr\.?|prof\.?)\s+/i.test(normalized) && !/\b(clinic|hospital|centre|center|institute|care|labs|diagnostics)\b/i.test(normalized);
}

export const REVIEW_TEMPLATES: ReviewTemplate[] = [
  // ─── TIER 1: 1-2 STARS (LOW / CRITICAL REVIEWS - 5 TEMPLATES) — SHORT & CRISP ───
  {
    id: "low_resolution_direct",
    title: "Direct Responsibility & Case Review",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "General Dissatisfaction",
    description: "Short, empathetic apology inviting direct resolution via the profile contact number.",
    template: "Hello {{firstName}}, we sincerely apologize that your experience with {{businessName}} fell short of expectations. Please connect with us via the contact number on our profile so we can resolve this directly.",
    doctorTemplate: "Hello {{firstName}}, {{businessName}} sincerely apologizes that your consultation fell short of expectations. Please reach out via the contact number on the profile so we can assist you directly."
  },
  {
    id: "low_wait_time",
    title: "Wait Time & Scheduling Empathy",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Wait Times / Delays",
    description: "Short, polite acknowledgment of wait times with a direct profile contact invitation.",
    template: "Thank you for your feedback, {{reviewerName}}. We apologize for the wait time during your visit with {{businessName}} and are working to make scheduling smoother. Please reach out via our profile contact number.",
    doctorTemplate: "Thank you for your feedback, {{reviewerName}}. {{businessName}} apologizes for the delay during your appointment, as every patient is given thorough consultation time. Please connect via the profile contact number."
  },
  {
    id: "low_communication_clarity",
    title: "Consultation & Communication Assurance",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Communication & Guidance",
    description: "Short reassurance regarding clear medical explanations and attentive care.",
    template: "Dear {{firstName}}, we are sorry your visit with {{businessName}} did not feel clear and attentive. Please contact us using the number on our profile so we can address your concerns personally.",
    doctorTemplate: "Dear {{firstName}}, {{businessName}} is sorry to hear your consultation did not meet your expectations. Clear guidance is always our priority, so please reach out via the number on our profile."
  },
  {
    id: "low_rating_only",
    title: "Star-Only Dissatisfaction Inquiry",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Rating Only",
    description: "Crisp, dignified inquiry when a reviewer leaves 1-2 stars without written text.",
    template: "Greetings {{reviewerName}}, thank you for your feedback for {{businessName}}. We are sorry your visit fell short of a 5-star experience. Please connect via the contact number on our profile so we can help.",
    doctorTemplate: "Greetings {{reviewerName}}, thank you for your feedback for {{businessName}}. We are sorry your visit fell short of expectations. Please reach out via the contact number on the profile so we can assist."
  },
  {
    id: "low_admin_service",
    title: "Appointment & Coordination Recovery",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Staff / Coordination",
    description: "Crisp apology for coordination hiccups with a direct profile resolution route.",
    template: "Hi {{firstName}}, we sincerely apologize for the inconvenience during your recent visit with {{businessName}}. Please connect with us via the phone number on our profile so we can make this right.",
    doctorTemplate: "Hi {{firstName}}, we sincerely apologize for any inconvenience during your appointment with {{businessName}}. Kindly reach out via the contact number on the profile so we can resolve this promptly."
  },

  // ─── TIER 2: 3 STARS (NEUTRAL / CONSTRUCTIVE REVIEWS - 4 TEMPLATES) — SHORT & CRISP ───
  {
    id: "neutral_balanced_care",
    title: "Constructive Feedback & Continuous Care",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Balanced Feedback",
    description: "Short, appreciative reply valuing patient feedback and ongoing care.",
    template: "Thank you for your feedback, {{reviewerName}}. At {{businessName}}, we value your input to keep improving our patient care. Wishing you continued good health!",
    doctorTemplate: "Thank you for your feedback, {{reviewerName}}. {{businessName}} values your input and remains committed to attentive, personalized patient care. Wishing you good health!"
  },
  {
    id: "neutral_patient_experience",
    title: "Attentive Service Elevation",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Service Follow-up",
    description: "Crisp invitation for suggestions to elevate a 3-star visit to 5 stars.",
    template: "Hello {{firstName}}, thank you for reviewing {{businessName}}. If we can do anything to make your next visit a 5-star experience, please reach out via our profile contact number.",
    doctorTemplate: "Hello {{firstName}}, thank you for reviewing your consultation with {{businessName}}. Please feel free to reach out via the profile contact number if we can assist you further."
  },
  {
    id: "neutral_concise_thanks",
    title: "Direct Professional Appreciation",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Concise Focus",
    description: "Direct, short reply reinforcing expertise and constructive care.",
    template: "Dear {{reviewerName}}, thank you for your constructive feedback for {{businessName}}. We appreciate your review and look forward to serving you even better next time.",
    doctorTemplate: "Dear {{reviewerName}}, thank you for sharing your feedback for {{businessName}}. Your input is appreciated, and we look forward to serving you even better at your next consultation."
  },
  {
    id: "neutral_consultation_focus",
    title: "Consultation Quality & Comfort",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Consultation Care",
    description: "Short commitment to transparent advice and thorough consultation.",
    template: "Hi {{firstName}}, thank you for sharing your thoughts on your visit with {{businessName}}. We remain dedicated to clear medical guidance and attentive patient support.",
    doctorTemplate: "Hi {{firstName}}, thank you for sharing your thoughts on your consultation with {{businessName}}. Providing clear guidance and attentive care is always our priority."
  },

  // ─── TIER 3: 4-5 STARS (HIGH / POSITIVE REVIEWS - 6 TEMPLATES) — SHORT & CRISP ───
  {
    id: "high_warm_doctor_guidance",
    title: "Doctor Consultation & Compassionate Care",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Doctor Guidance",
    description: "Short, warm thank-you focusing on clear doctor consultation and patient comfort.",
    template: "Hello {{firstName}}, thank you for your kind 5-star review of {{businessName}}! We are glad you felt comfortable and well-guided during your consultation. Wishing you great health!",
    doctorTemplate: "Hello {{firstName}}, thank you for your kind words! {{businessName}} is glad you felt comfortable and well-guided during your consultation. Wishing you continued good health!"
  },
  {
    id: "high_staff_and_clinic",
    title: "Supportive Care & Patient Experience",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Care & Support",
    description: "Crisp appreciation celebrating supportive care and patient trust.",
    template: "Thank you for your wonderful review, {{reviewerName}}! Everyone at {{businessName}} truly appreciates your trust and kind recommendation. Wishing you great health!",
    doctorTemplate: "Thank you for your wonderful review, {{reviewerName}}! {{businessName}} truly appreciates your trust and kind recommendation. Wishing you great health!"
  },
  {
    id: "high_short_direct",
    title: "Short & Crisp Appreciation",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Short & Direct",
    description: "Ultra-crisp thank-you focusing on trust, attentive care, and good wishes.",
    template: "Dear {{reviewerName}}, thank you for your 5-star rating and trust in {{businessName}}! Providing attentive care and clear guidance is always our priority. Wishing you good health!",
    doctorTemplate: "Dear {{reviewerName}}, thank you for your 5-star rating and trust in {{businessName}}! Providing attentive care and clear medical guidance is always our priority. Wishing you good health!"
  },
  {
    id: "high_seo_authority",
    title: "Specialty & Location Authority Focus",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "SEO Authority",
    description: "Crisp specialty & location authority reply with natural keyword integration.",
    template: "Greetings {{firstName}}, thank you for your positive review of {{businessName}}! As a trusted {{targetKeyword}}, we are committed to delivering attentive, personalized care. Wishing you good health!",
    doctorTemplate: "Greetings {{firstName}}, thank you for your kind review! As a trusted {{targetKeyword}}, {{businessName}} is committed to delivering attentive, personalized care. Wishing you great health!"
  },
  {
    id: "high_consultation_recovery",
    title: "Treatment Outcome & Smooth Recovery",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Treatment Outcome",
    description: "Short thank-you highlighting smooth treatment and healthy recovery.",
    template: "Hi {{reviewerName}}, thank you for your heartfelt feedback! We are delighted your treatment with {{businessName}} went smoothly. Wishing you a speedy and healthy recovery!",
    doctorTemplate: "Hi {{reviewerName}}, thank you for your heartfelt feedback! {{businessName}} is delighted to know your treatment and recovery went smoothly. Wishing you continued good health!"
  },
  {
    id: "high_family_trust",
    title: "Patient Trust & Recommendation",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Trust & Recommendation",
    description: "Crisp gratitude for patient recommendation and long-term trust.",
    template: "Dear {{firstName}}, thank you for your kind review and trust in {{businessName}}. We truly appreciate your recommendation and wish you and your family excellent health!",
    doctorTemplate: "Dear {{firstName}}, thank you for your kind review and trust in {{businessName}}. Your recommendation means a lot, and we wish you and your family excellent health!"
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
  const isDoctor = isIndividualDoctorProfile(params.businessName);
  const businessName = normalizeBusinessName(params.businessName);

  let rawTemplate = "";
  if (typeof params.template === "string") {
    if (isDoctor) {
      const matched = REVIEW_TEMPLATES.find(t => t.template === params.template || t.doctorTemplate === params.template);
      rawTemplate = matched?.doctorTemplate || params.template;
    } else {
      rawTemplate = params.template;
    }
  } else {
    rawTemplate = isDoctor ? (params.template.doctorTemplate || params.template.template) : params.template.template;
  }

  const validFullName = extractValidFullName(params.reviewerName);
  const firstName = extractFirstName(params.reviewerName);
  const cityOrArea = params.cityOrArea?.trim() || "";

  let defaultKeyword = "specialist";
  if (/sheerin/i.test(params.businessName || "")) {
    defaultKeyword = "plastic surgeon";
  } else if (isDoctor) {
    defaultKeyword = "specialist doctor";
  }

  let targetKeyword = params.targetKeyword?.trim() || defaultKeyword;
  // For Dr. Sheerin or individual doctors, ensure targetKeyword never contains "clinic"
  if (isDoctor) {
    targetKeyword = targetKeyword.replace(/\bclinic\b/gi, "").replace(/\s{2,}/g, " ").trim() || defaultKeyword;
  }
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

  // If individual doctor (such as Dr. Sheerin Shah), ensure the word "clinic" never appears
  if (isDoctor) {
    rendered = rendered
      .replace(/\bour clinic\b/gi, businessName)
      .replace(/\bthe clinic\b/gi, businessName)
      .replace(/\bclinic\b/gi, "")
      .replace(/\bat Dr\./gi, "with Dr.");
  }

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
