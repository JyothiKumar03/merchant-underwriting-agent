import { CATEGORY, OFFER_STATUS, RISK_TIER, UNDER_WRITING_MODE, WHATSAPP_STATUS } from "@/constants";

export type TUnderWritingMode = (typeof UNDER_WRITING_MODE)[number];
export type TRiskTier = (typeof RISK_TIER)[number];
export type TOfferStatus = (typeof OFFER_STATUS)[number];
export type TWhatsAppStatus = (typeof WHATSAPP_STATUS)[number];
export type TCategory = (typeof CATEGORY)[number];

export type TMerchantProfile = {
  merchant_id: string;
  name: string;
  category: TCategory;
  contact_whatsapp: string;
  months_on_platform: number;
  total_deals_listed: number;
  monthly_gmv_12m: number[];
  coupon_redemption_rate: number;
  unique_customer_count: number;
  customer_return_rate: number;
  avg_order_value: number;
  seasonality_index: number;
  deal_exclusivity_rate: number;
  return_and_refund_rate: number;
};

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

export type TUnderwritingResult = {
  id?: number;
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
  whatsapp_message_sid?: string | null;
  nach_umrn?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TMerchantWithResult = TMerchantProfile & {
  result: TUnderwritingResult | null;
};

// API response types

export type TGetMerchantsResponse = {
  merchants: TMerchantWithResult[];
};

export type TUnderwriteResponse = {
  result: TUnderwritingResult;
};

export type TSendOfferResponse = {
  whatsapp_status: TWhatsAppStatus;
  message_sid?: string;
};

export type TAcceptOfferResponse = {
  offer_status: TOfferStatus;
  nach_umrn: string;
};

// API request types

export type TUnderwriteRequest = {
  mode: TUnderWritingMode;
};

export type TSendOfferRequest = {
  merchantId: string;
  mode: TUnderWritingMode;
};

export type TAcceptOfferRequest = {
  merchantId: string;
};

// Merchant creation

export type TMerchantInput = {
  name: string;
  category: TCategory;
  contact_whatsapp: string;
  months_on_platform: number;
  total_deals_listed: number;
  monthly_gmv_12m: number[];
  coupon_redemption_rate: number;
  unique_customer_count: number;
  customer_return_rate: number;
  avg_order_value: number;
  seasonality_index: number;
  deal_exclusivity_rate: number;
  return_and_refund_rate: number;
};

export type TCreateMerchantResponse = {
  merchant: TMerchantProfile;
};

export type TBulkUploadResponse = {
  inserted_count: number;
  failed_count: number;
  inserted: { merchant_id: string; name: string }[];
  validation_errors: { row: number; error: string }[];
  insert_errors: { row: number; error: string }[];
};
