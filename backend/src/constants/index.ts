import type { RiskTier } from "../types/index.js";

// ── Pre-Filter Thresholds ────────────────────────────────────────────────────

export const PRE_FILTER = {
  MIN_MONTHS_ON_PLATFORM: 6,
  MIN_AVG_MONTHLY_GMV_INR: 50_000,
  MAX_REFUND_RATE: 0.10,
} as const;

// ── Scoring Weights (must sum to 1.0) ────────────────────────────────────────

export const SCORING_WEIGHTS = {
  GMV_GROWTH: 0.25,
  STABILITY: 0.20,
  LOYALTY: 0.20,
  QUALITY: 0.20,
  ENGAGEMENT: 0.15,
} as const;

// ── Tier Thresholds (composite score boundaries) ─────────────────────────────

export const TIER_THRESHOLDS = {
  TIER_1_MIN: 75,
  TIER_2_MIN: 50,
  TIER_3_MIN: 30,
} as const;

// ── Credit Configuration by Tier ─────────────────────────────────────────────

export interface CreditTierConfig {
  /** Multiplier applied to average monthly GMV to get the credit limit */
  multiplier: number;
  interest_rate_percent: number;
  tenure_options_months: number[];
  max_credit_inr: number;
}

export const CREDIT_CONFIG: Record<Exclude<RiskTier, "Rejected">, CreditTierConfig> = {
  "Tier 1": {
    multiplier: 6,
    interest_rate_percent: 14.5,
    tenure_options_months: [6, 12, 18],
    max_credit_inr: 5_000_000, // ₹50L
  },
  "Tier 2": {
    multiplier: 4,
    interest_rate_percent: 16.5,
    tenure_options_months: [6, 12],
    max_credit_inr: 2_000_000, // ₹20L
  },
  "Tier 3": {
    multiplier: 2,
    interest_rate_percent: 19.5,
    tenure_options_months: [6],
    max_credit_inr: 500_000, // ₹5L
  },
};

// ── Insurance Configuration by Category ──────────────────────────────────────

export interface InsuranceCategoryConfig {
  policy_type: string;
  /** Annual premium as fraction of coverage amount */
  risk_factor: number;
}

export const INSURANCE_CATEGORY_CONFIG: Record<string, InsuranceCategoryConfig> = {
  "Fashion & Beauty": {
    policy_type: "Inventory Protection + Business Interruption",
    risk_factor: 0.025,
  },
  Electronics: {
    policy_type: "Inventory Protection + Transit Damage Cover",
    risk_factor: 0.03,
  },
  "Food & Delivery": {
    policy_type: "Business Interruption + Liability Cover",
    risk_factor: 0.035,
  },
  "Health & Wellness": {
    policy_type: "Business Interruption + Compliance Cover",
    risk_factor: 0.02,
  },
  Travel: {
    policy_type: "Business Interruption + Cancellation Cover",
    risk_factor: 0.028,
  },
};

/** Premium adjustment factor per tier (1.0 = standard, < 1.0 = discount, > 1.0 = surcharge) */
export const TIER_PREMIUM_MULTIPLIER: Record<Exclude<RiskTier, "Rejected">, number> = {
  "Tier 1": 0.85,
  "Tier 2": 1.0,
  "Tier 3": 1.2,
};

/** Coverage = average monthly GMV × this multiplier (3 months revenue protection) */
export const INSURANCE_COVERAGE_MONTHS = 3;

// ── AI Service Configuration ─────────────────────────────────────────────────

export const AI_SERVICE = {
  PRIMARY_MODEL: "claude-sonnet-4-5",
  FALLBACK_MODEL: "claude-haiku-4-5",
  MAX_RETRIES: 3,
  /** Base delay in ms between retries (exponential backoff applied) */
  RETRY_BASE_DELAY_MS: 500,
  MAX_OUTPUT_TOKENS: 512,
  TEMPERATURE: 0.3,
} as const;

// ── WhatsApp Message Templates ────────────────────────────────────────────────

export const WHATSAPP = {
  FROM_NUMBER_PREFIX: "whatsapp:",
  /** Twilio sandbox join keyword (used in sandbox mode only) */
  SANDBOX_KEYWORD: "join",
} as const;

// ── NACH Configuration ────────────────────────────────────────────────────────

export const NACH = {
  UMRN_PREFIX: "GRAB",
  MANDATE_VALIDITY_YEARS: 3,
} as const;

// ── HTTP Status Codes used in controllers ─────────────────────────────────────

export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
} as const;
