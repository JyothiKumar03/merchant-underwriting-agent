import type {
  TRiskTier,
  TCategory,
  TCreditTierConfig,
  TInsuranceCategoryConfig,
} from "../types/index.js";

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

export const PRE_FILTER = {
  MIN_MONTHS_ON_PLATFORM: 6,
  MIN_AVG_MONTHLY_GMV_INR: 50_000,
  MAX_REFUND_RATE: 0.10,
} as const;

export const SCORING_WEIGHTS = {
  GMV_GROWTH: 0.25,
  STABILITY: 0.20,
  LOYALTY: 0.20,
  QUALITY: 0.20,
  ENGAGEMENT: 0.15,
} as const;

export const TIER_THRESHOLDS = {
  TIER_1_MIN: 75,
  TIER_2_MIN: 50,
  TIER_3_MIN: 30,
} as const;

export const CREDIT_CONFIG: Record<Exclude<TRiskTier, "rejected">, TCreditTierConfig> = {
  tier_1: {
    multiplier: 6,
    interest_rate_percent: 14.5,
    tenure_options_months: [6, 12, 18],
    max_credit_inr: 5_000_000,
  },
  tier_2: {
    multiplier: 4,
    interest_rate_percent: 16.5,
    tenure_options_months: [6, 12],
    max_credit_inr: 2_000_000,
  },
  tier_3: {
    multiplier: 2,
    interest_rate_percent: 19.5,
    tenure_options_months: [6],
    max_credit_inr: 500_000,
  },
};

export const INSURANCE_CATEGORY_CONFIG: Record<TCategory, TInsuranceCategoryConfig> = {
  fashion_beauty: {
    policy_type: "Inventory Protection + Business Interruption",
    risk_factor: 0.025,
  },
  electronics: {
    policy_type: "Inventory Protection + Transit Damage Cover",
    risk_factor: 0.03,
  },
  food_delivery: {
    policy_type: "Business Interruption + Liability Cover",
    risk_factor: 0.035,
  },
  health_wellness: {
    policy_type: "Business Interruption + Compliance Cover",
    risk_factor: 0.02,
  },
  travel: {
    policy_type: "Business Interruption + Cancellation Cover",
    risk_factor: 0.028,
  },
};

export const TIER_PREMIUM_MULTIPLIER: Record<Exclude<TRiskTier, "rejected">, number> = {
  tier_1: 0.85,
  tier_2: 1.0,
  tier_3: 1.2,
};

export const INSURANCE_COVERAGE_MONTHS = 3;

export const AI_SERVICE = {
  MAX_RETRIES: 2,
  RETRY_BASE_DELAY_MS: 500,
  MAX_OUTPUT_TOKENS: 512,
  TEMPERATURE: 0.3,
} as const;

export const WHATSAPP = {
  FROM_NUMBER_PREFIX: "whatsapp:",
  SANDBOX_KEYWORD: "join",
} as const;

export const NACH = {
  UMRN_PREFIX: "GRAB-NACH",
  MANDATE_VALIDITY_YEARS: 3,
} as const;

export const SUPPORT = {
  EMAIL: "support@grabon.in",
} as const;

export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
} as const;
