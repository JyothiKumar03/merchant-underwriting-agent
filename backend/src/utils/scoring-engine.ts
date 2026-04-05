import type { TMerchantProfile, TCategoryBenchmark, TScoringBreakdown, TRiskTier } from "../types/index.js";
import { PRE_FILTER, SCORING_WEIGHTS, TIER_THRESHOLDS } from "../constants/index.js";

export type TScoringResult = {
  scoring: TScoringBreakdown;
  tier: TRiskTier;
};

export const run_scoring = (
  merchant: TMerchantProfile,
  benchmark: TCategoryBenchmark
): TScoringResult => {
  const pre_filter = run_pre_filter(merchant);

  if (!pre_filter.passed) {
    const scoring: TScoringBreakdown = {
      pre_filter_passed: false,
      pre_filter_reason: pre_filter.reason,
      gmv_growth_score: 0,
      stability_score: 0,
      loyalty_score: 0,
      quality_score: 0,
      engagement_score: 0,
      composite_score: 0,
    };
    return { scoring, tier: "rejected" };
  }

  const gmv_growth_score = calc_gmv_growth_score(merchant.monthly_gmv_12m);
  const stability_score = calc_stability_score(merchant.monthly_gmv_12m);
  const loyalty_score = calc_loyalty_score(merchant.customer_return_rate, benchmark.avg_return_rate);
  const quality_score = calc_quality_score(merchant.return_and_refund_rate, benchmark.avg_refund_rate);
  const engagement_score = calc_engagement_score(
    merchant.coupon_redemption_rate,
    merchant.deal_exclusivity_rate,
    merchant.months_on_platform
  );

  const sub_scores = { gmv_growth_score, stability_score, loyalty_score, quality_score, engagement_score };
  const composite_score = calc_composite(sub_scores);
  const tier = composite_to_tier(composite_score);

  return {
    scoring: { pre_filter_passed: true, ...sub_scores, composite_score },
    tier,
  };
};


const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round2 = (value: number): number => Math.round(value * 100) / 100;

const avg = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

const stddev = (values: number[], mean: number): number => {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

type TPreFilterResult =
  | { passed: true }
  | { passed: false; reason: string };

const run_pre_filter = (merchant: TMerchantProfile): TPreFilterResult => {
  if (merchant.months_on_platform < PRE_FILTER.MIN_MONTHS_ON_PLATFORM) {
    return {
      passed: false,
      reason: `Insufficient tenure: ${merchant.months_on_platform} months (min ${PRE_FILTER.MIN_MONTHS_ON_PLATFORM})`,
    };
  }

  const non_zero_gmv = merchant.monthly_gmv_12m.filter((v) => v > 0);
  const avg_gmv = avg(non_zero_gmv);

  if (avg_gmv < PRE_FILTER.MIN_AVG_MONTHLY_GMV_INR) {
    const avg_lakhs = (avg_gmv / 100_000).toFixed(2);
    const min_lakhs = (PRE_FILTER.MIN_AVG_MONTHLY_GMV_INR / 100_000).toFixed(1);
    return {
      passed: false,
      reason: `Avg GMV Rs.${avg_lakhs}L below minimum Rs.${min_lakhs}L`,
    };
  }

  if (merchant.return_and_refund_rate > PRE_FILTER.MAX_REFUND_RATE) {
    const pct = (merchant.return_and_refund_rate * 100).toFixed(1);
    return {
      passed: false,
      reason: `Refund rate ${pct}% exceeds 10% threshold`,
    };
  }

  return { passed: true };
};

// Concept: revenue trajectory — are sales trending up or down?
// We compare the average of the first half of active months vs the second half.
// Positive growth maps to a higher score (50 = flat, 100 = +50% growth).
const calc_gmv_growth_score = (monthly_gmv_12m: number[]): number => {
  const non_zero = monthly_gmv_12m.filter((v) => v > 0);
  if (non_zero.length < 2) return 50;

  const mid = Math.floor(non_zero.length / 2);
  const avg_first = avg(non_zero.slice(0, mid));
  const avg_second = avg(non_zero.slice(mid));

  if (avg_first === 0) return 50;
  const growth_rate = (avg_second - avg_first) / avg_first;
  return round2(clamp(50 + growth_rate * 100, 0, 100));
};

// Concept: cash-flow predictability — erratic GMV signals operational risk.
// Coefficient of variation (stddev / mean) measures dispersion relative to scale.
// CV near 0 is perfectly stable (score 100); CV near 1 is highly volatile (score 0).
const calc_stability_score = (monthly_gmv_12m: number[]): number => {
  const non_zero = monthly_gmv_12m.filter((v) => v > 0);
  if (non_zero.length < 2) return 50;

  const mean = avg(non_zero);
  if (mean === 0) return 0;

  const cv = stddev(non_zero, mean) / mean;
  return round2(clamp((1 - cv) * 100, 0, 100));
};

// Concept: customer stickiness — repeat buyers indicate sustainable demand.
// We benchmark the merchant's return rate against the category average.
// A ratio above 1.0 (better than peers) scores above 50; below 0.5x = 0.
const calc_loyalty_score = (
  customer_return_rate: number,
  benchmark_return_rate: number
): number => {
  if (benchmark_return_rate === 0) return 50;
  const ratio = customer_return_rate / benchmark_return_rate;
  return round2(clamp((ratio - 0.5) * 100, 0, 100));
};

// Concept: product & service quality — high refunds erode margin and signal dissatisfaction.
// We compare the merchant's refund rate to the category average.
// Lower relative refunds = higher score (inverse relationship: ratio 0.5 → 100, ratio 2.0+ → 0).
const calc_quality_score = (
  refund_rate: number,
  benchmark_refund_rate: number
): number => {
  if (benchmark_refund_rate === 0) return 50;
  const ratio = refund_rate / benchmark_refund_rate;
  return round2(clamp(((2.0 - ratio) / 1.5) * 100, 0, 100));
};

// Concept: platform commitment — active merchants are less likely to churn mid-repayment.
// Weighted sum of coupon redemption (demand activation), exclusivity (lock-in), and tenure (track record).
// Tenure is capped at 36 months so new-ish but active merchants aren't penalised infinitely.
const calc_engagement_score = (
  coupon_redemption_rate: number,
  deal_exclusivity_rate: number,
  months_on_platform: number
): number => {
  const tenure_frac = Math.min(months_on_platform / 36, 1);
  const score =
    (coupon_redemption_rate * 0.4 +
      deal_exclusivity_rate * 0.3 +
      tenure_frac * 0.3) *
    100;
  return round2(clamp(score, 0, 100));
};

const calc_composite = (
  scores: Pick<TScoringBreakdown, "gmv_growth_score" | "stability_score" | "loyalty_score" | "quality_score" | "engagement_score">
): number =>
  round2(
    scores.gmv_growth_score * SCORING_WEIGHTS.GMV_GROWTH +
    scores.stability_score * SCORING_WEIGHTS.STABILITY +
    scores.loyalty_score * SCORING_WEIGHTS.LOYALTY +
    scores.quality_score * SCORING_WEIGHTS.QUALITY +
    scores.engagement_score * SCORING_WEIGHTS.ENGAGEMENT
  );

const composite_to_tier = (composite: number): TRiskTier => {
  if (composite >= TIER_THRESHOLDS.TIER_1_MIN) return "tier_1";
  if (composite >= TIER_THRESHOLDS.TIER_2_MIN) return "tier_2";
  if (composite >= TIER_THRESHOLDS.TIER_3_MIN) return "tier_3";
  return "rejected";
};

