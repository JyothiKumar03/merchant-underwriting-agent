import type { TCategory, TRiskTier, TOfferStatus, TWhatsAppStatus } from "@/types";

export const CATEGORY_LABELS: Record<TCategory, string> = {
  fashion_beauty: "Fashion & Beauty",
  travel: "Travel",
  health_wellness: "Health & Wellness",
  electronics: "Electronics",
  food_delivery: "Food & Delivery",
};

export const RISK_TIER_LABELS: Record<TRiskTier, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  rejected: "Rejected",
};

export const OFFER_STATUS_LABELS: Record<TOfferStatus, string> = {
  not_underwritten: "Pending",
  underwritten: "Underwritten",
  offer_sent: "Offer Sent",
  mandate_active: "Mandate Active",
};

export const WHATSAPP_STATUS_LABELS: Record<TWhatsAppStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  failed: "Failed",
};

export const CATEGORY_EMOJI: Record<TCategory, string> = {
  fashion_beauty: "👗",
  travel: "✈️",
  health_wellness: "💊",
  electronics: "📱",
  food_delivery: "🍔",
};

export const UNDER_WRITING_MODE = ["credit", "insurance"] as const;
export const RISK_TIER = ["tier_1", "tier_2", "tier_3", "rejected"] as const;
export const OFFER_STATUS = [
  "not_underwritten",
  "underwritten",
  "offer_sent",
  "mandate_active",
] as const;
export const WHATSAPP_STATUS = ["not_sent", "sent", "failed"] as const;
export const CATEGORY = [
  "fashion_beauty",
  "travel",
  "health_wellness",
  "electronics",
  "food_delivery",
] as const;


export const FOOTER_TEXT = `GrabCredit × GrabInsurance @2026`