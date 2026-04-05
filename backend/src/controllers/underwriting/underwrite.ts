import type { Request, Response } from "express";
import { z } from "zod";
import { get_merchant_by_id } from "../../data/merchants.js";
import { get_category_benchmark } from "../../data/category-benchmarks.js";
import {
  get_result_by_merchant,
  upsert_underwriting_result,
  patch_rationale,
  get_db_merchant_by_id,
} from "../../models/schema.js";
import { run_scoring } from "../../utils/scoring-engine.js";
import { calc_both_offers } from "../../utils/offer-calculator.js";
import { generate_object } from "../../services/ai-service.js";
import {
  RATIONALE_MODELS,
  RATIONALE_SYSTEM_PROMPT,
  build_rationale_prompt,
} from "../../utils/ai-prompts.js";
import { HTTP, AI_SERVICE } from "../../constants/index.js";
import type {
  TUnderWritingMode,
   TRationaleOutput,
   TMerchantProfile,
   TRiskTier,
   TScoringBreakdown,
   TCreditOffer,
  TInsuranceOffer,
 TCategoryBenchmark,
} from "../../types/index.js";
import {
  ZUnderwriteBody,
  ZMerchantIdParam,
  ZRationaleOutput,
} from "../../types/index.js";

export const underwrite = async (req: Request, res: Response): Promise<void> => {
  // 1. Zod validation
  let id: string;
  let mode: TUnderWritingMode;

  try {
    ({ id } = ZMerchantIdParam.parse(req.params));
    ({ mode } = ZUnderwriteBody.parse(req.body));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(HTTP.BAD_REQUEST).json({ error: "Validation failed", details: z.treeifyError(err) });
      return;
    }
    throw err;
  }

  // 2. Find merchant — check static data first, then DB
  const merchant = get_merchant_by_id(id) ?? await get_db_merchant_by_id(id);
  if (!merchant) {
    res.status(HTTP.NOT_FOUND).json({ error: `Merchant ${id} not found` });
    return;
  }

  const benchmark = get_category_benchmark(merchant.category);

  // 3. Check DB for existing result — apply caching logic
  const existing = await get_result_by_merchant(id);

  if (existing) {
    const has_rationale = mode === "credit"
      ? existing.credit_rationale.length > 0
      : existing.insurance_rationale.length > 0;

    if (has_rationale) {
      res.status(HTTP.OK).json({ result: existing });
      return;
    }

    // Scoring is cached — only the rationale for this mode is missing
    const output = await generate_rationale(
      mode, merchant,
      existing.risk_tier, existing.scoring,
      existing.credit_offer, existing.insurance_offer,
      benchmark
    );
    await patch_rationale(id, mode, output.analyst_explanation, output.user_message);

    const updated = await get_result_by_merchant(id);
    res.status(HTTP.OK).json({ result: updated });
    return;
  }

  // 4. Full pipeline: pre-filter → scoring → both offers → AI (selected mode only)
  const { scoring, tier } = run_scoring(merchant, benchmark);
  const { credit_offer, insurance_offer } = calc_both_offers(merchant, tier);

  const output = await generate_rationale(
    mode, merchant, tier, scoring, credit_offer, insurance_offer, benchmark
  );

  const result = await upsert_underwriting_result({
    merchant_id: merchant.merchant_id,
    merchant_name: merchant.name,
    risk_tier: tier,
    scoring,
    credit_offer,
    insurance_offer,
    credit_rationale: mode === "credit" ? output.analyst_explanation : "",
    credit_user_message: mode === "credit" ? output.user_message : "",
    insurance_rationale: mode === "insurance" ? output.analyst_explanation : "",
    insurance_user_message: mode === "insurance" ? output.user_message : "",
    offer_status: "underwritten",
    whatsapp_status: "not_sent",
    timestamp: new Date().toISOString(),
  });

  // 5. Return result
  res.status(HTTP.OK).json({ result });
};

const generate_rationale = async (
  mode: TUnderWritingMode,
  merchant: TMerchantProfile,
  tier: TRiskTier,
  scoring: TScoringBreakdown,
  credit_offer: TCreditOffer | null,
  insurance_offer: TInsuranceOffer | null,
  benchmark: TCategoryBenchmark
): Promise<TRationaleOutput> => {
  const prompt = build_rationale_prompt(mode, merchant, tier, scoring, credit_offer, insurance_offer, benchmark);

  try {
    return await generate_object({
      models: RATIONALE_MODELS,
      system: RATIONALE_SYSTEM_PROMPT,
      prompt,
      schema: ZRationaleOutput,
      max_tokens: AI_SERVICE.MAX_OUTPUT_TOKENS,
      temperature: AI_SERVICE.TEMPERATURE,
    });
  } catch (err) {
    console.error("[underwrite] AI generation failed, using fallback:", err);
    return build_fallback_rationale(mode, merchant, tier, scoring, credit_offer, insurance_offer);
  }
};

const build_fallback_rationale = (
  mode: TUnderWritingMode,
  merchant: TMerchantProfile,
  tier: TRiskTier,
  scoring: TScoringBreakdown,
  credit_offer: TCreditOffer | null,
  insurance_offer: TInsuranceOffer | null
): TRationaleOutput => {
  const ret_pct = (merchant.customer_return_rate * 100).toFixed(1);
  const ref_pct = (merchant.return_and_refund_rate * 100).toFixed(1);
  const score = scoring.composite_score.toFixed(1);

  if (!scoring.pre_filter_passed) {
    return {
      user_message: `Hi ${merchant.name}, we reviewed your profile but it doesn't meet our minimum eligibility criteria at this stage. ${scoring.pre_filter_reason ?? "We look at platform tenure and average monthly sales to ensure offers are suitable for your business."}  We encourage you to keep growing on the platform and reapply in a few months — we'd love to support you then!`,
      analyst_explanation: `${merchant.name} was rejected at the pre-filter stage. Reason: ${scoring.pre_filter_reason ?? "did not meet minimum eligibility criteria"}. Confidence is high — this is a hard rule, not a scoring judgment. No offer should be generated until the failing criterion is resolved.`,
    };
  }

  if (tier === "rejected") {
    return {
      user_message: `Hi ${merchant.name}, after reviewing your business performance we're unable to extend an offer at this time. Your composite risk score came in below our minimum threshold, driven mainly by customer retention and refund levels. We re-evaluate quarterly — keep growing your loyal customer base and reducing returns, and we'd be happy to review your profile again soon!`,
      analyst_explanation: `${merchant.name} passed pre-filter but scored ${score}/100 (threshold: 30). Low loyalty score driven by ${ret_pct}% customer return rate and elevated quality risk from ${ref_pct}% refund rate were the primary drag factors. Confidence: moderate — borderline cases at this tier benefit from manual review. Recommend re-scoring in 3–6 months if merchant addresses loyalty and refund metrics.`,
    };
  }

  if (mode === "credit" && credit_offer) {
    return {
      user_message: `Great news, ${merchant.name}! We've reviewed your GrabOn performance and you've been pre-approved for a GrabCredit working capital loan. Your strong repeat customer base and consistent sales history helped you qualify. Reply ACCEPT to proceed and our team will guide you through the next steps!`,
      analyst_explanation: `${merchant.name} approved for GrabCredit under ${tier.replace("_", " ")} with composite score ${score}/100. Credit limit Rs.${(credit_offer.credit_limit_inr / 100_000).toFixed(1)}L at ${credit_offer.interest_rate_percent}% p.a. Key positives: ${ret_pct}% customer return rate and ${ref_pct}% refund rate. Confidence: high for this tier. Fallback rationale used — AI call failed.`,
    };
  }

  if (mode === "insurance" && insurance_offer) {
    return {
      user_message: `Great news, ${merchant.name}! Based on your GrabOn business profile you're eligible for a GrabInsurance business cover. This policy is tailored to your category and designed to protect your revenue during unexpected disruptions. Reply ACCEPT to activate your cover and our team will be in touch!`,
      analyst_explanation: `${merchant.name} approved for ${insurance_offer.policy_type} under ${tier.replace("_", " ")} with composite score ${score}/100. Coverage Rs.${(insurance_offer.coverage_amount_inr / 100_000).toFixed(1)}L at Rs.${(insurance_offer.annual_premium_inr / 1_000).toFixed(1)}K annual premium. Confidence: high for this tier. Fallback rationale used — AI call failed.`,
    };
  }

  return {
    user_message: "We encountered an issue generating your offer details. Our team will reach out shortly with your personalised offer.",
    analyst_explanation: "Rationale could not be generated — AI call failed and no offer mode matched. Manual review required.",
  };
};
