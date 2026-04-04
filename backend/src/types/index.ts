import { z } from "zod";

// ── Enums / Literals ────────────────────────────────────────────────────────

/** Used when sending a WhatsApp offer — pick which product to send */
export type Mode = "credit" | "insurance";

export type RiskTier = "tier_1" | "tier_2" | "tier_3" | "rejected";

export type OfferStatus =
  | "not_underwritten"
  | "underwritten"
  | "offer_sent"
  | "mandate_active";

export type WhatsAppStatus = "not_sent" | "sent" | "failed";

// ── Core Domain Types ───────────────────────────────────────────────────────

export interface MerchantProfile {
  merchant_id: string;
  name: string;
  category: string;
  contact_whatsapp: string;
  months_on_platform: number;
  total_deals_listed: number;
  /** 12 monthly GMV values in ₹ (raw). Zero means no activity that month. */
  monthly_gmv_12m: number[];
  /** 0–1: fraction of issued coupons that were redeemed */
  coupon_redemption_rate: number;
  unique_customer_count: number;
  /** 0–1: fraction of customers who made a repeat purchase */
  customer_return_rate: number;
  /** Average order value in ₹ */
  avg_order_value: number;
  /** Peak GMV / trough GMV. 1.0 = perfectly stable, 3.0+ = highly volatile */
  seasonality_index: number;
  /** 0–1: fraction of deals listed exclusively on GrabOn */
  deal_exclusivity_rate: number;
  /** 0–1: fraction of orders returned or refunded */
  return_and_refund_rate: number;
}

export interface CategoryBenchmark {
  avg_return_rate: number;
  avg_refund_rate: number;
  avg_monthly_gmv: number;
  avg_order_value: number;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export interface ScoringBreakdown {
  pre_filter_passed: boolean;
  pre_filter_reason?: string;
  /** 0–100, weight 25% */
  gmv_growth_score: number;
  /** 0–100, weight 20% */
  stability_score: number;
  /** 0–100, weight 20% */
  loyalty_score: number;
  /** 0–100, weight 20% */
  quality_score: number;
  /** 0–100, weight 15% */
  engagement_score: number;
  /** Weighted sum of the five sub-scores */
  composite_score: number;
}

// ── Offers ──────────────────────────────────────────────────────────────────

export interface CreditOffer {
  credit_limit_inr: number;
  interest_rate_percent: number;
  tenure_options_months: number[];
}

export interface InsuranceOffer {
  coverage_amount_inr: number;
  annual_premium_inr: number;
  quarterly_premium_inr: number;
  policy_type: string;
}

// ── Underwriting Result ─────────────────────────────────────────────────────
// One call computes BOTH credit and insurance simultaneously.
// Mode is NOT stored on the result — it is only used when sending WhatsApp.

export interface UnderwritingResult {
  merchant_id: string;
  merchant_name: string;
  risk_tier: RiskTier;
  scoring: ScoringBreakdown;
  credit_offer: CreditOffer | null;
  insurance_offer: InsuranceOffer | null;
  /** Claude-generated rationale framed for the credit product */
  credit_rationale: string;
  /** Claude-generated rationale framed for the insurance product */
  insurance_rationale: string;
  offer_status: OfferStatus;
  whatsapp_status: WhatsAppStatus;
  whatsapp_message_sid?: string;
  /** Set when the merchant accepts the offer (mock NACH mandate) */
  nach_umrn?: string;
  timestamp: string;
}

// ── API Request / Response Shapes ───────────────────────────────────────────

/** POST /api/underwrite/:id — no body required, scores both products at once */
export type UnderwriteRequest = Record<string, never>;

/** POST /api/send-offer — specify which product to send via WhatsApp */
export interface SendOfferRequest {
  merchant_id: string;
  mode: Mode;
}

/** POST /api/accept-offer — confirm NACH mandate */
export interface AcceptOfferRequest {
  merchant_id: string;
}

// ── Zod Schemas (API validation) ────────────────────────────────────────────

export const SendOfferRequestSchema = z.object({
  merchant_id: z.string().min(1),
  mode: z.enum(["credit", "insurance"]),
});

export const AcceptOfferRequestSchema = z.object({
  merchant_id: z.string().min(1),
});

// ── DB Row Types ─────────────────────────────────────────────────────────────

/** Row shape as stored in the `underwriting_results` Neon table */
export interface UnderwritingResultRow {
  id: number;
  merchant_id: string;
  merchant_name: string;
  risk_tier: RiskTier;
  scoring: ScoringBreakdown;
  credit_offer: CreditOffer | null;
  insurance_offer: InsuranceOffer | null;
  credit_rationale: string;
  insurance_rationale: string;
  offer_status: OfferStatus;
  whatsapp_status: WhatsAppStatus;
  whatsapp_message_sid: string | null;
  nach_umrn: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Row shape as stored in the `whatsapp_logs` Neon table */
export interface WhatsAppLogRow {
  id: number;
  merchant_id: string;
  message_sid: string | null;
  to_number: string;
  message_body: string;
  mode: Mode;
  status: WhatsAppStatus;
  error_message: string | null;
  sent_at: Date;
}
