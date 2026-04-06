import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial();

export const createLocationSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  gbpAccountId: z.string().min(1, "Google Account ID is required"),
  gbpLocationId: z.string().min(1, "Google Location ID is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const createPostSchema = z.object({
  locationId: z.string().min(1, "Location ID is required"),
  summary: z.string().min(1, "Content summary is required"),
  topicType: z.enum(["STANDARD", "EVENT", "OFFER"]).default("STANDARD"),
  ctaType: z.enum(["BOOK", "ORDER", "SHOP", "LEARN_MORE", "SIGN_UP", "CALL"]).optional().nullable(),
  ctaUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  mediaUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  mediaType: z.enum(["PHOTO", "VIDEO"]).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED"]).default("DRAFT"),
  // Event fields
  eventTitle: z.string().optional().nullable(),
  eventStartDate: z.string().datetime().optional().nullable(),
  eventEndDate: z.string().datetime().optional().nullable(),
  // Offer fields
  offerCouponCode: z.string().optional().nullable(),
  offerRedeemUrl: z.string().url().optional().nullable().or(z.literal("")),
  offerTerms: z.string().optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial();
