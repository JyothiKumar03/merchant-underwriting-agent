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

You must return a JSON object with exactly two fields:

1. "user_message": A short, warm 2-3 sentence WhatsApp message addressed directly to the merchant.
   - Mention the outcome (approved/rejected) and one key reason with a specific number.
   - Friendly, plain language. No jargon.
   - Do NOT include offer amounts or interest rates — those are added separately.

2. "analyst_explanation": A detailed 3-5 sentence internal rationale.
   - Reference SPECIFIC numbers (exact %, exact Rs. amounts).
   - Compare to category averages where relevant.
   - For rejections: what failed and what to improve.
   - For Tier 3: acknowledge risks while noting positives.

RULES for both fields:
- Do NOT invent data. Only use numbers provided in the prompt.
- No headers, no bullet points inside the strings.`;

export const build_rationale_prompt = (
  mode: TUnderWritingMode,
  merchant: TMerchantProfile,
  tier: TRiskTier,
  scoring: TScoringBreakdown,
  credit_offer: TCreditOffer | null,
  insurance_offer: TInsuranceOffer | null,
  benchmark: TCategoryBenchmark
): string => {
  const non_zero_gmv = merchant.monthly_gmv_12m.filter((v) => v > 0);
  const avg_gmv_inr =
    non_zero_gmv.length > 0
      ? non_zero_gmv.reduce((a, b) => a + b, 0) / non_zero_gmv.length
      : 0;

  let offer_line: string;
  if (tier === "rejected") {
    offer_line = "No offer extended.";
  } else if (mode === "credit" && credit_offer) {
    offer_line = `Credit Limit: Rs.${(credit_offer.credit_limit_inr / 100_000).toFixed(1)}L | Rate: ${credit_offer.interest_rate_percent}% p.a. | Tenure: ${credit_offer.tenure_options_months.join("/")} months`;
  } else if (mode === "insurance" && insurance_offer) {
    offer_line = `Coverage: Rs.${(insurance_offer.coverage_amount_inr / 100_000).toFixed(1)}L | Premium: Rs.${insurance_offer.quarterly_premium_inr.toLocaleString("en-IN")}/qtr | Policy: ${insurance_offer.policy_type}`;
  } else {
    offer_line = "No offer for this mode.";
  }

  const tier_label = tier === "rejected"
    ? "Rejected"
    : tier.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return `MODE: ${mode === "credit" ? "GrabCredit (Working Capital Loan)" : "GrabInsurance (Business Interruption Cover)"}

MERCHANT:
- Name: ${merchant.name}
- Category: ${merchant.category.replace("_", " ")}
- Months on Platform: ${merchant.months_on_platform}
- Avg Monthly GMV: Rs.${(avg_gmv_inr / 100_000).toFixed(1)}L
- Monthly GMV (12m): ${merchant.monthly_gmv_12m.map((v) => `Rs.${(v / 100_000).toFixed(1)}L`).join(", ")}
- Customer Return Rate: ${(merchant.customer_return_rate * 100).toFixed(1)}% (Category Avg: ${(benchmark.avg_return_rate * 100).toFixed(1)}%)
- Refund Rate: ${(merchant.return_and_refund_rate * 100).toFixed(1)}% (Category Avg: ${(benchmark.avg_refund_rate * 100).toFixed(1)}%)
- Coupon Redemption Rate: ${(merchant.coupon_redemption_rate * 100).toFixed(1)}%
- Deal Exclusivity Rate: ${(merchant.deal_exclusivity_rate * 100).toFixed(1)}%
- Seasonality Index: ${merchant.seasonality_index}

SCORES:
- GMV Growth: ${scoring.gmv_growth_score}/100 (25%)
- Stability:  ${scoring.stability_score}/100 (20%)
- Loyalty:    ${scoring.loyalty_score}/100 (20%)
- Quality:    ${scoring.quality_score}/100 (20%)
- Engagement: ${scoring.engagement_score}/100 (15%)
- Composite:  ${scoring.composite_score}/100
${!scoring.pre_filter_passed ? `- Pre-filter rejection: ${scoring.pre_filter_reason}` : ""}

DECISION: ${tier_label}
OFFER: ${offer_line}

Return the JSON object now:`;
};
