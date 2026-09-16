/**
 * review-templates.ts
 *
 * Comprehensive Library of 15 Unique, Dynamic Google Review Reply Templates
 * Tier 1: 1-2 Stars (Low / Critical Reviews) — 5 Templates (Calm, empathetic, professional, private resolution)
 * Tier 2: 3 Stars (Neutral / Constructive Reviews) — 4 Templates (Balanced, improvement-focused, SEO blended)
 * Tier 3: 4-5 Stars (High / Positive Reviews) — 6 Templates (Grateful, warm, treatment & consultation focused, SEO blended)
 *
 * Dynamic Placeholders:
 * - {{reviewerName}} : Full name of reviewer or "there"
 * - {{firstName}}    : First name of reviewer or "there"
 * - {{businessName}} : Practice / Clinic / Business Name
 * - {{cityOrArea}}    : City or locality
 * - {{targetKeyword}} : Primary Search & Specialty Keyword (e.g. "neurologist in Mohali")
 * - {{contactPhone}}  : Clinic contact phone number
 * - {{contactEmail}}  : Clinic contact email
 * - {{orEmail}}       : " or email us at {{contactEmail}}" if email exists
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
    title: "Direct Clinical Responsibility & Resolution",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "General Dissatisfaction",
    description: "Empathetic acknowledgment taking full clinical responsibility and offering a direct private resolution channel.",
    template: "Hello {{firstName}}, we take your feedback very seriously and sincerely apologize that your experience at {{businessName}} did not meet our high standards. Our team is committed to providing attentive patient care and clear guidance. We would appreciate the opportunity to review your case and resolve your concerns directly. Please contact our management team at {{contactPhone}}{{orEmail}} so we can assist you personally."
  },
  {
    id: "low_wait_time",
    title: "Wait Time & Scheduling Empathy",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Wait Times / Delays",
    description: "Addresses wait time concerns with empathy while explaining clinical thoroughness and active scheduling optimization.",
    template: "Thank you for sharing your feedback, {{reviewerName}}. We apologize for the delay you experienced during your visit to {{businessName}}. While our clinical team strives to give every consultation the thorough time it requires, we understand your time is valuable and we are actively optimizing our scheduling flow. Please reach out to us at {{contactPhone}} so we can connect with you directly."
  },
  {
    id: "low_communication_clarity",
    title: "Consultation & Communication Assurance",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Communication & Guidance",
    description: "Reassures patient regarding doctor communication, clear medical explanations, and attentive bedside manner.",
    template: "Dear {{firstName}}, we are truly sorry to hear that your visit did not reflect the attentive communication our practice strives for. Clear explanations and patient comfort are central to our work at {{businessName}}. We want to understand what happened and ensure your concerns are thoroughly addressed. Please reach out to our team at {{contactPhone}}{{orEmail}} at your convenience."
  },
  {
    id: "low_rating_only",
    title: "Star-Only Dissatisfaction (No Written Comment)",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Rating Only",
    description: "Proactive, dignified inquiry when a user leaves 1-2 stars without written explanation.",
    template: "Hello {{reviewerName}}, thank you for rating {{businessName}}. We are concerned to see that your visit fell short of the 5-star standard we strive to provide every patient. As a dedicated {{targetKeyword}}, our entire team is committed to continuous improvement. We would value hearing more about your experience—please contact us directly at {{contactPhone}} so we can assist you."
  },
  {
    id: "low_admin_service",
    title: "Administrative & Front Desk Service Recovery",
    tier: "LOW",
    minRating: 1,
    maxRating: 2,
    category: "Staff / Administration",
    description: "Apologizes for front desk, reception, or coordination hiccups with a prompt resolution route.",
    template: "Thank you for bringing this to our attention, {{firstName}}. We sincerely apologize for any frustration caused during your recent visit to {{businessName}}. Delivering a seamless and respectful patient experience from front desk to consultation is our highest priority. We would like to address this issue directly with you. Please call us at {{contactPhone}}{{orEmail}}."
  },

  // ─── TIER 2: 3 STARS (NEUTRAL / CONSTRUCTIVE REVIEWS - 4 TEMPLATES) ────────
  {
    id: "neutral_balanced_care",
    title: "Constructive Feedback & Continuous Improvement",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Balanced Feedback",
    description: "Constructive appreciation highlighting clinical standards and natural SEO keywords.",
    template: "Thank you for sharing your balanced feedback, {{reviewerName}}. At {{businessName}}, we constantly strive to deliver thorough diagnostic care and a comfortable clinical experience. We appreciate your observations and will use them to refine our patient services. As a committed {{targetKeyword}}, our team remains dedicated to supporting your ongoing health and well-being."
  },
  {
    id: "neutral_patient_experience",
    title: "Attentive Follow-up & Service Refinement",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Service Follow-up",
    description: "Warm invitation for suggestions to elevate 3-star visits to 5-star clinical standard.",
    template: "Hello {{firstName}}, thank you for reviewing {{businessName}}. We appreciate your feedback as it helps our entire clinical team uphold the highest standards of care and clear communication. If there is anything specific we can do to make your next visit a 5-star experience, please feel free to reach out to us at {{contactPhone}}. We wish you good health."
  },
  {
    id: "neutral_concise_thanks",
    title: "Direct Appreciation & Professional Focus",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Concise",
    description: "Brief, professional reply without opening name, reinforcing practice expertise.",
    template: "We appreciate you taking the time to share your feedback with our team at {{businessName}}. Providing attentive clinical guidance and personalized care as a trusted {{targetKeyword}} is our daily focus. We have noted your comments and look forward to serving you even better during your next consultation."
  },
  {
    id: "neutral_consultation_focus",
    title: "Clinical Quality & Patient Comfort",
    tier: "NEUTRAL",
    minRating: 3,
    maxRating: 3,
    category: "Clinical Care",
    description: "Reaffirms commitment to transparent care and thorough consultation.",
    template: "Dear {{reviewerName}}, thank you for your review. Our team at {{businessName}} is dedicated to providing comprehensive consultations and transparent patient care. We value your perspective and will continue working hard to ensure every visit is seamless. We appreciate your trust in our practice and wish you all the best."
  },

  // ─── TIER 3: 4-5 STARS (HIGH / POSITIVE REVIEWS - 6 TEMPLATES) ────────────
  {
    id: "high_warm_doctor_guidance",
    title: "Detailed Doctor Guidance & Compassionate Care",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Doctor Guidance",
    description: "Warm appreciation focusing on clear doctor consultation, guidance, and patient reassurance.",
    template: "Hello {{firstName}}, thank you so much for your kind words and 5-star review of {{businessName}}. Our team is delighted to know that you felt well-guided and comfortable during your consultation. As a dedicated {{targetKeyword}}, we are committed to providing personalized treatment and thorough care for every patient. We wish you continued good health!"
  },
  {
    id: "high_staff_and_clinic",
    title: "Comprehensive Team & Clinical Excellence",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Team & Atmosphere",
    description: "Celebrates full team coordination, supportive clinic atmosphere, and local authority.",
    template: "Thank you for your wonderful review, {{reviewerName}}! Our entire staff and clinical team at {{businessName}} strive to make every visit as comfortable, reassuring, and thorough as possible. We are grateful for your recommendation and are honored to serve our community as a trusted {{targetKeyword}}. Please take care and stay healthy!"
  },
  {
    id: "high_short_direct",
    title: "Concise & Elegant Team Appreciation",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Short & Direct",
    description: "Compact 40-word high-impact thank-you focusing on prompt service and medical guidance.",
    template: "Thank you for your generous 5-star rating and trust in {{businessName}}. Delivering attentive patient care, clear medical guidance, and prompt service is always our team's highest priority. We look forward to continuing to assist you and wish you great health and happiness."
  },
  {
    id: "high_seo_authority",
    title: "Specialty & Location Authority Focus",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "SEO Authority",
    description: "Positions the clinic as the leading medical authority in the city with seamless keyword blend.",
    template: "Dear {{firstName}}, thank you for taking the time to review {{businessName}}. As a leading {{targetKeyword}}, our team is deeply committed to combining clinical excellence with attentive, empathetic patient support. Your positive feedback motivates our entire staff to keep delivering top-quality care. We wish you a speedy recovery and wonderful well-being."
  },
  {
    id: "high_consultation_recovery",
    title: "Treatment Outcome & Patient Recovery",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Treatment Outcome",
    description: "Focuses on successful clinical outcomes, thorough recovery, and ongoing support.",
    template: "Thank you so much for your heartfelt feedback, {{reviewerName}}. It is truly rewarding for our team at {{businessName}} to know that your consultation and treatment went smoothly. Ensuring clear explanations and long-term patient recovery is at the heart of what we do. We are always here whenever you need clinical guidance."
  },
  {
    id: "high_family_trust",
    title: "Long-term Trust & Practice Recommendation",
    tier: "HIGH",
    minRating: 4,
    maxRating: 5,
    category: "Family & Community",
    description: "Emphasizes multi-generational patient trust, welcoming environment, and ongoing care.",
    template: "Hello {{firstName}}, we truly appreciate your kind review and trust in {{businessName}}. Providing a welcoming atmosphere, transparent medical guidance, and reliable {{targetKeyword}} services is what our practice strives for every single day. Thank you for choosing our clinic, and we wish you and your family excellent health."
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
 * Extracts a clean first name from full name or returns "there"
 */
export function extractFirstName(fullName?: string | null): string {
  if (!fullName) return "there";
  const clean = fullName.trim();
  if (!clean || clean.toLowerCase().includes("google user") || clean.toLowerCase().includes("anonymous")) {
    return "there";
  }
  const first = clean.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Renders a dynamic review template with all parameters interpolated cleanly
 */
export function renderReviewTemplate(params: RenderTemplateParams): string {
  const rawTemplate = typeof params.template === "string" ? params.template : params.template.template;
  
  const fullName = params.reviewerName?.trim() || "";
  const validFullName = fullName && !fullName.toLowerCase().includes("google user") && !fullName.toLowerCase().includes("anonymous") 
    ? fullName 
    : "there";
  
  const firstName = extractFirstName(params.reviewerName);
  const businessName = params.businessName?.trim() || "our clinic";
  const cityOrArea = params.cityOrArea?.trim() || "";
  
  let targetKeyword = params.targetKeyword?.trim() || "healthcare provider";
  if (cityOrArea && !targetKeyword.toLowerCase().includes(cityOrArea.toLowerCase())) {
    targetKeyword = `${targetKeyword} in ${cityOrArea}`;
  }

  const contactPhone = params.contactPhone?.trim() || "+91 98765 43210";
  const contactEmail = params.contactEmail?.trim() || "";
  const orEmail = contactEmail ? ` or email us at ${contactEmail}` : "";

  let rendered = rawTemplate
    .replace(/\{\{reviewerName\}\}/g, validFullName)
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{businessName\}\}/g, businessName)
    .replace(/\{\{cityOrArea\}\}/g, cityOrArea)
    .replace(/\{\{targetKeyword\}\}/g, targetKeyword)
    .replace(/\{\{contactPhone\}\}/g, contactPhone)
    .replace(/\{\{contactEmail\}\}/g, contactEmail)
    .replace(/\{\{orEmail\}\}/g, orEmail);

  // Clean up punctuation and spacing
  rendered = rendered
    .replace(/["“”]/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/\s{2,}/g, " ")
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
    if (text.includes("average") || text.includes("ok") || text.includes("okay") || text.includes("fair") || text.includes("moderate")) {
      return REVIEW_TEMPLATES.find(t => t.id === "neutral_patient_experience") || REVIEW_TEMPLATES[6];
    }
    if (text.includes("doctor") || text.includes("consult") || text.includes("treatment")) {
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
