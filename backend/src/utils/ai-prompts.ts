import type {
  TMerchantProfile,
  TUnderWritingMode,
  TRiskTier,
  TScoringBreakdown,
  TCreditOffer,
  TInsuranceOffer,
  TCategoryBenchmark,
  TAiModel,
} from "../types/index.js";

export const RATIONALE_MODELS: TAiModel[] = [
  { provider: "openai", model_id: "gpt-4o-mini" },
  { provider: "open_router", model_id: "openai/gpt-4o-mini" },
];

export const RATIONALE_SYSTEM_PROMPT = `You are a senior financial underwriting analyst at GrabOn.

Your main task is to take the input data, risk analysis input and then provide an offer to the end user (user_message)
and also an appropriate explaination as analyst on why you have provided it

Return a JSON object with exactly two fields:

1. "user_message"
   - 3-5 warm sentences sent directly to the merchant over WhatsApp.
   - State the outcome (approved / rejected) and 1-2 reasons clearly.
   - Do NOT mention complicated terms, make it a user friendly message.

2. "analyst_explanation"
   - 3-5 sentences of internal reasoning — NEVER shown to the merchant.
   - Explain: (1) what primarily drove the decision, citing specific numbers from the prompt;
     (2) your confidence in the data (e.g. sparse GMV months, high seasonality);
     (3) any edge cases, risk flags, or borderline factors worth noting.
   - This is the analyst audit trail, not a summary — show your reasoning.

STRICT RULES:
- Use only numbers provided in the prompt. Do not invent or extrapolate.
- Sub-scores are normalized indices 0–100, NOT percentage growth rates.
  Never write "GMV growth of 63.2%" — write "GMV growth score 63.2/100". It's a score, not percentage.
- Metric directions are stated explicitly in the METHODOLOGY section. Follow them precisely.
- No bullet points or headers inside either string value.`;

// ---------- helpers (mirror scoring-engine logic for prompt derivation) ----------

const avg = (vals: number[]): number =>
  vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

const stddev = (vals: number[], mean: number): number => {
  if (vals.length < 2) return 0;
  return Math.sqrt(vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length);
};

const fmt_inr = (n: number): string => {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const pct = (r: number): string => `${(r * 100).toFixed(1)}%`;

// ---------- main prompt builder ----------

export const build_rationale_prompt = (
  mode: TUnderWritingMode,
  merchant: TMerchantProfile,
  tier: TRiskTier,
  scoring: TScoringBreakdown,
  credit_offer: TCreditOffer | null,
  insurance_offer: TInsuranceOffer | null,
  benchmark: TCategoryBenchmark
): string => {
  const non_zero = merchant.monthly_gmv_12m.filter((v) => v > 0);
  const avg_gmv = avg(non_zero);

  // GMV growth derivation
  const mid = Math.floor(non_zero.length / 2);
  const first_half = non_zero.slice(0, mid);
  const second_half = non_zero.slice(mid);
  const avg_h1 = avg(first_half);
  const avg_h2 = avg(second_half);
  const growth_pct = avg_h1 > 0 ? ((avg_h2 - avg_h1) / avg_h1) * 100 : 0;

  // Stability derivation
  const mean_gmv = avg_gmv;
  const cv = mean_gmv > 0 ? stddev(non_zero, mean_gmv) / mean_gmv : 0;

  // Loyalty ratio
  const loyalty_ratio = benchmark.avg_return_rate > 0
    ? merchant.customer_return_rate / benchmark.avg_return_rate
    : 1;

  // Quality ratio
  const quality_ratio = benchmark.avg_refund_rate > 0
    ? merchant.return_and_refund_rate / benchmark.avg_refund_rate
    : 1;

  // Engagement tenure fraction
  const tenure_frac = Math.min(merchant.months_on_platform / 36, 1);

  // Offer line
  let offer_line: string;
  if (tier === "rejected") {
    offer_line = "No offer — merchant did not qualify.";
  } else if (mode === "credit" && credit_offer) {
    offer_line = `Credit limit: ${fmt_inr(credit_offer.credit_limit_inr)} | Rate: ${credit_offer.interest_rate_percent}% p.a. | Tenure: ${credit_offer.tenure_options_months.join("/")} months`;
  } else if (mode === "insurance" && insurance_offer) {
    offer_line = `Coverage: ${fmt_inr(insurance_offer.coverage_amount_inr)} | Premium: ${fmt_inr(insurance_offer.quarterly_premium_inr)}/qtr | Policy: ${insurance_offer.policy_type}`;
  } else {
    offer_line = "No offer for this mode.";
  }

  const tier_label = tier === "rejected"
    ? "REJECTED"
    : tier.replace("_", " ").toUpperCase();

  const gmv_series = merchant.monthly_gmv_12m
    .map((v) => (v === 0 ? "₹0" : fmt_inr(v)))
    .join(", ");

  return `MODE: ${mode === "credit" ? "GrabCredit (working capital loan)" : "GrabInsurance (business interruption cover)"}

━━ SOURCE DATA — raw merchant inputs ━━
Business: ${merchant.name}
Category: ${merchant.category.replace(/_/g, " ")} | Platform tenure: ${merchant.months_on_platform} months | Deals listed: ${merchant.total_deals_listed}
Monthly GMV (M1–M12): ${gmv_series}
Non-zero months: ${non_zero.length} of 12 | Avg monthly GMV: ${fmt_inr(avg_gmv)}
Customer return rate: ${pct(merchant.customer_return_rate)} | Refund rate: ${pct(merchant.return_and_refund_rate)} | Coupon redemption: ${pct(merchant.coupon_redemption_rate)}
Deal exclusivity: ${pct(merchant.deal_exclusivity_rate)} | Avg order value: ${fmt_inr(merchant.avg_order_value)} | Seasonality index: ${merchant.seasonality_index.toFixed(2)}

━━ RISK SCORING METHODOLOGY ━━
Each score is a normalized index 0–100. They are NOT percentage growth rates.

1. GMV GROWTH (weight 25%) → score: ${scoring.gmv_growth_score.toFixed(1)}/100
   • Source: first-half avg ${fmt_inr(avg_h1)} vs second-half avg ${fmt_inr(avg_h2)} across ${non_zero.length} active months.
   • Method: raw_growth = (H2 − H1) / H1 = ${growth_pct.toFixed(1)}%. Score = clamp(50 + growth×1, 0, 100). Score 50 = flat; 100 = +50% growth; 0 = −50% decline.

2. STABILITY (weight 20%) → score: ${scoring.stability_score.toFixed(1)}/100
   • Source: coefficient of variation (CV) of non-zero GMV months = ${cv.toFixed(3)} (stddev/mean).
   • Method: score = clamp((1 − CV) × 100, 0, 100). Low CV = predictable cash flows = high score.

3. LOYALTY (weight 20%) → score: ${scoring.loyalty_score.toFixed(1)}/100
   • Source: merchant return rate ${pct(merchant.customer_return_rate)} vs category benchmark ${pct(benchmark.avg_return_rate)}.
   • Method: ratio = merchant / benchmark = ${loyalty_ratio.toFixed(2)}. Score = clamp((ratio − 0.5) × 100, 0, 100). HIGHER return rate = MORE repeat buyers = POSITIVE signal.

4. QUALITY (weight 20%) → score: ${scoring.quality_score.toFixed(1)}/100
   • Source: merchant refund rate ${pct(merchant.return_and_refund_rate)} vs category benchmark ${pct(benchmark.avg_refund_rate)}.
   • Method: ratio = merchant / benchmark = ${quality_ratio.toFixed(2)}. Score = clamp(((2.0 − ratio) / 1.5) × 100, 0, 100). LOWER refund rate = better quality = POSITIVE signal.

5. ENGAGEMENT (weight 15%) → score: ${scoring.engagement_score.toFixed(1)}/100
   • Source: coupon redemption ${pct(merchant.coupon_redemption_rate)}, deal exclusivity ${pct(merchant.deal_exclusivity_rate)}, tenure ${merchant.months_on_platform} months (${(tenure_frac * 100).toFixed(0)}% of 36-month cap).
   • Method: score = (redemption × 0.4 + exclusivity × 0.3 + tenure_frac × 0.3) × 100. Higher platform commitment = higher score.

COMPOSITE: ${scoring.composite_score.toFixed(1)}/100${!scoring.pre_filter_passed ? `\nPRE-FILTER FAILED: ${scoring.pre_filter_reason}` : ""}

━━ DECISION ━━
Tier: ${tier_label}
Offer: ${offer_line}

Return the JSON object now:`;
};
