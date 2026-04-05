import { z } from "zod";
import {
  RISK_TIER,
  UNDER_WRITING_MODE,
  OFFER_STATUS,
  WHATSAPP_STATUS,
  CATEGORY,
} from "../constants";

export type TUnderWritingMode = (typeof UNDER_WRITING_MODE)[number];
export type TRiskTier = (typeof RISK_TIER)[number];
export type TOfferStatus = (typeof OFFER_STATUS)[number];
export type TWhatsAppStatus = (typeof WHATSAPP_STATUS)[number];
export type TCategory = (typeof CATEGORY)[number];

// Core domain types

export type TMerchantProfile = {
  merchant_id: string;
  name: string;
  category: TCategory;
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

export type TCategoryBenchmark = {
  avg_return_rate: number;
  avg_refund_rate: number;
  avg_monthly_gmv: number;
  avg_order_value: number;
};

export type CategoryBenchmark = TCategoryBenchmark;

// Config types (used by constants and utilities)

export type TCreditTierConfig = {
  multiplier: number;
  interest_rate_percent: number;
  tenure_options_months: number[];
  max_credit_inr: number;
};

export type CreditTierConfig = TCreditTierConfig;

export type TInsuranceCategoryConfig = {
  policy_type: string;
  risk_factor: number;
};

export type InsuranceCategoryConfig = TInsuranceCategoryConfig;

// Scoring

export type TScoringBreakdown = {
  pre_filter_passed: boolean;
  pre_filter_reason?: string;
  gmv_growth_score: number;
  stability_score: number;
  loyalty_score: number;
  quality_score: number;
  engagement_score: number;
  composite_score: number;
};

export type ScoringBreakdown = TScoringBreakdown;

// Offers

export type TCreditOffer = {
  credit_limit_inr: number;
  interest_rate_percent: number;
  tenure_options_months: number[];
};

export type TInsuranceOffer = {
  coverage_amount_inr: number;
  annual_premium_inr: number;
  quarterly_premium_inr: number;
  policy_type: string;
};

export type CreditOffer = TCreditOffer;
export type InsuranceOffer = TInsuranceOffer;

// AI rationale — two-part structured output

export const ZRationaleOutput = z.object({
  user_message: z.string().describe(
    "Short, warm 2-3 sentence WhatsApp message sent directly to the merchant. Mention the offer/rejection outcome and one key reason. Use plain language."
  ),
  analyst_explanation: z.string().describe(
    "Detailed 3-5 sentence internal rationale with specific numbers, benchmarks, and scoring breakdown. Used for dashboard and records."
  ),
});

export type TRationaleOutput = z.infer<typeof ZRationaleOutput>;

// Underwriting result

export type TUnderwritingResult = {
  merchant_id: string;
  merchant_name: string;
  risk_tier: TRiskTier;
  scoring: TScoringBreakdown;
  credit_offer: TCreditOffer | null;
  insurance_offer: TInsuranceOffer | null;
  credit_rationale: string;
  credit_user_message: string;
  insurance_rationale: string;
  insurance_user_message: string;
  offer_status: TOfferStatus;
  whatsapp_status: TWhatsAppStatus;
  whatsapp_message_sid?: string;
  nach_umrn?: string;
  timestamp: string;
};

export type UnderwritingResult = TUnderwritingResult;

// DB row types

export type TUnderwritingResultRow = {
  id: number;
  merchant_id: string;
  merchant_name: string;
  risk_tier: TRiskTier;
  scoring: TScoringBreakdown;
  credit_offer: TCreditOffer | null;
  insurance_offer: TInsuranceOffer | null;
  credit_rationale: string;
  credit_user_message: string;
  insurance_rationale: string;
  insurance_user_message: string;
  offer_status: TOfferStatus;
  whatsapp_status: TWhatsAppStatus;
  whatsapp_message_sid: string | null;
  nach_umrn: string | null;
  created_at: Date;
  updated_at: Date;
};

export type UnderwritingResultRow = TUnderwritingResultRow;

export type TWhatsAppLogRow = {
  id: number;
  merchant_id: string;
  message_sid: string | null;
  to_number: string;
  message_body: string;
  mode: TUnderWritingMode;
  status: TWhatsAppStatus;
  error_message: string | null;
  sent_at: Date;
};

export type WhatsAppLogRow = TWhatsAppLogRow;

// AI service types

export type TAiProvider = "openai" | "anthropic" | "open_router";

export type TAiModel = {
  model_id: string;
  provider: TAiProvider;
};

export type TAiGenerateObjectParams<T> = {
  models: TAiModel[];
  system: string;
  prompt: string;
  schema: z.ZodSchema<T>;
  max_tokens?: number;
  temperature?: number;
};

// Twilio types

export type TTwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

export type TWhatsAppDeliveryResult = {
  status: TWhatsAppStatus;
  messageSid?: string;
  errorMessage?: string;
  messageBody: string;
};

// Zod schemas

export const ZSendOfferBody = z.object({
  merchantId: z.string().min(1),
  mode: z.enum(UNDER_WRITING_MODE),
});

export const ZAcceptOfferBody = z.object({
  merchantId: z.string().min(1),
});

export const ZUnderwriteBody = z.object({
  mode: z.enum(UNDER_WRITING_MODE),
});

export const ZMerchantIdParam = z.object({
  id: z.string().min(1),
});

export const SendOfferRequestSchema = ZSendOfferBody;
export const AcceptOfferRequestSchema = ZAcceptOfferBody;

export type SendOfferRequest = z.infer<typeof ZSendOfferBody>;
export type AcceptOfferRequest = z.infer<typeof ZAcceptOfferBody>;
export type UnderwriteRequest = z.infer<typeof ZUnderwriteBody>;
