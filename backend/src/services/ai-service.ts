import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type {
  MerchantProfile,
  Mode,
  RiskTier,
  ScoringBreakdown,
  CreditOffer,
  InsuranceOffer,
  CategoryBenchmark,
} from "../types/index.js";
import { AI_SERVICE } from "../constants/index.js";

// ── Client setup ──────────────────────────────────────────────────────────────

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return createAnthropic({ apiKey });
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior financial underwriting analyst at GrabOn.

Write a 3-5 sentence rationale explaining why this merchant received their risk tier and offer.

RULES:
- Reference SPECIFIC numbers from the merchant data (exact %, exact ₹ amounts)
- Compare to category averages where relevant
- For rejections: explain what failed and what the merchant can improve
- For Tier 3: acknowledge risks while noting positives
- Output ONLY the rationale text. No headers, no bullets, no JSON.
- Do NOT invent data. Only use numbers provided below.`;

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(
  mode: Mode,
  merchant: MerchantProfile,
  tier: RiskTier,
  scoring: ScoringBreakdown,
  creditOffer: CreditOffer | null,
  insuranceOffer: InsuranceOffer | null,
  benchmark: CategoryBenchmark
): string {
  const nonZeroGmv = merchant.monthly_gmv_12m.filter((v) => v > 0);
  const avgGmvInr =
    nonZeroGmv.length > 0
      ? nonZeroGmv.reduce((a, b) => a + b, 0) / nonZeroGmv.length
      : 0;

  let offerLine: string;
  if (tier === "rejected") {
    offerLine = "No offer extended.";
  } else if (mode === "credit" && creditOffer) {
    offerLine = `Credit Limit: ₹${(creditOffer.credit_limit_inr / 100_000).toFixed(1)}L | Rate: ${creditOffer.interest_rate_percent}% p.a. | Tenure: ${creditOffer.tenure_options_months.join("/")} months`;
  } else if (mode === "insurance" && insuranceOffer) {
    offerLine = `Coverage: ₹${(insuranceOffer.coverage_amount_inr / 100_000).toFixed(1)}L | Premium: ₹${insuranceOffer.quarterly_premium_inr.toLocaleString("en-IN")}/qtr | Policy: ${insuranceOffer.policy_type}`;
  } else {
    offerLine = "No offer for this mode.";
  }

  return `MODE: ${mode === "credit" ? "GrabCredit (Working Capital Loan)" : "GrabInsurance (Business Interruption Cover)"}

MERCHANT:
- Name: ${merchant.name}
- Category: ${merchant.category}
- Months on Platform: ${merchant.months_on_platform}
- Avg Monthly GMV: ₹${(avgGmvInr / 100_000).toFixed(1)}L
- Monthly GMV (12m): ${merchant.monthly_gmv_12m.map((v) => `₹${(v / 100_000).toFixed(1)}L`).join(", ")}
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

DECISION: ${tier}
OFFER: ${offerLine}

Write the rationale (3-5 sentences):`;
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ── Main service function ─────────────────────────────────────────────────────

/**
 * Generates a 3–5 sentence rationale for one product (credit OR insurance).
 * Called twice per underwrite via Promise.all — once per mode.
 *
 * Retry strategy:
 * 1. Primary model (claude-sonnet-4-5) with exponential backoff up to MAX_RETRIES.
 * 2. Fallback to claude-haiku-4-5 (single attempt).
 * 3. Last resort: deterministic template — API never fails due to AI outage.
 */
export async function generateRationale(
  mode: Mode,
  merchant: MerchantProfile,
  tier: RiskTier,
  scoring: ScoringBreakdown,
  creditOffer: CreditOffer | null,
  insuranceOffer: InsuranceOffer | null,
  benchmark: CategoryBenchmark
): Promise<string> {
  const anthropic = getAnthropicClient();
  const userPrompt = buildUserPrompt(
    mode, merchant, tier, scoring, creditOffer, insuranceOffer, benchmark
  );

  const callModel = async (model: string): Promise<string> => {
    const { text } = await generateText({
      model: anthropic(model),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: AI_SERVICE.MAX_OUTPUT_TOKENS,
      temperature: AI_SERVICE.TEMPERATURE,
    });
    return text.trim();
  };

  // Primary: claude-sonnet-4-5 with exponential backoff
  try {
    return await withRetry(
      () => callModel(AI_SERVICE.PRIMARY_MODEL),
      AI_SERVICE.MAX_RETRIES,
      AI_SERVICE.RETRY_BASE_DELAY_MS
    );
  } catch (primaryError) {
    console.error(
      `[ai-service] Primary model (${AI_SERVICE.PRIMARY_MODEL}) failed after ${AI_SERVICE.MAX_RETRIES} retries:`,
      primaryError
    );
  }

  // Fallback: claude-haiku-4-5 (single attempt)
  try {
    console.warn(`[ai-service] Falling back to ${AI_SERVICE.FALLBACK_MODEL}`);
    return await callModel(AI_SERVICE.FALLBACK_MODEL);
  } catch (fallbackError) {
    console.error(
      `[ai-service] Fallback model (${AI_SERVICE.FALLBACK_MODEL}) also failed:`,
      fallbackError
    );
  }

  // Last resort: deterministic template
  return buildTemplateRationale(
    mode, merchant, tier, scoring, creditOffer, insuranceOffer
  );
}

// ── Template fallback ─────────────────────────────────────────────────────────

function buildTemplateRationale(
  mode: Mode,
  merchant: MerchantProfile,
  tier: RiskTier,
  scoring: ScoringBreakdown,
  creditOffer: CreditOffer | null,
  insuranceOffer: InsuranceOffer | null
): string {
  if (!scoring.pre_filter_passed) {
    return `${merchant.name} did not qualify for a pre-approved offer at this time. ${scoring.pre_filter_reason ?? "The merchant profile does not meet the minimum eligibility criteria."}. We encourage the merchant to continue growing on the platform and reapply once the highlighted criteria are met.`;
  }

  if (tier === "rejected") {
    return `${merchant.name} passed initial eligibility checks but received a composite risk score of ${scoring.composite_score}/100, below the minimum threshold of 30. The primary drag was a combination of low customer loyalty (${(merchant.customer_return_rate * 100).toFixed(1)}%) and elevated refund rates (${(merchant.return_and_refund_rate * 100).toFixed(1)}%). We recommend improving platform engagement and reducing refunds over the next 3–6 months before reapplying.`;
  }

  if (mode === "credit" && creditOffer) {
    return `${merchant.name} has been approved for a working capital credit limit of ₹${(creditOffer.credit_limit_inr / 100_000).toFixed(1)}L at ${creditOffer.interest_rate_percent}% p.a. under ${tier} (composite score: ${scoring.composite_score}/100). The merchant demonstrates a customer return rate of ${(merchant.customer_return_rate * 100).toFixed(1)}% and a refund rate of ${(merchant.return_and_refund_rate * 100).toFixed(1)}%, reflecting demand stability and product quality. Platform engagement — ${(merchant.coupon_redemption_rate * 100).toFixed(1)}% coupon redemption and ${merchant.months_on_platform} months of active presence — further supported this tier classification.`;
  }

  if (mode === "insurance" && insuranceOffer) {
    return `${merchant.name} has been approved for ${insuranceOffer.policy_type} with ₹${(insuranceOffer.coverage_amount_inr / 100_000).toFixed(1)}L coverage at ₹${(insuranceOffer.annual_premium_inr / 1_000).toFixed(1)}K annual premium under ${tier} (composite score: ${scoring.composite_score}/100). The merchant's customer return rate of ${(merchant.customer_return_rate * 100).toFixed(1)}% and refund rate of ${(merchant.return_and_refund_rate * 100).toFixed(1)}% indicate a stable and quality business warranting this coverage tier. The seasonality index of ${merchant.seasonality_index} is factored into the premium calculation.`;
  }

  return "Rationale could not be generated. Please contact support.";
}
